import { Injectable, Logger } from '@nestjs/common';
import type { Locale } from '@atm/contracts';
import { PrismaService } from '../../prisma/prisma.service';

interface IndexInput {
  entity: 'news' | 'page' | 'document' | 'vacancy' | 'person';
  entityId: string;
  locale: Locale;
  title: string;
  content: string;
  href: string;
  date?: Date | null;
}

/**
 * Поддержание поискового индекса (п. VI ТЗ).
 *
 * Контентные модули дёргают index() при публикации и remove() при снятии
 * с публикации или удалении. Отдельная таблица search_documents с tsvector
 * позволяет искать сразу по всем типам контента одним запросом вместо
 * UNION по пяти таблицам с их переводами.
 *
 * Ошибки индексации не должны ронять сохранение контента — редактор
 * опубликовал новость, и она обязана опубликоваться, даже если индексатор
 * временно недоступен.
 */
@Injectable()
export class SearchIndexerService {
  private readonly logger = new Logger(SearchIndexerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Извлекает читаемый текст из массива блоков для полнотекстового поиска. */
  static blocksToText(blocks: unknown): string {
    if (!Array.isArray(blocks)) return '';
    const parts: string[] = [];
    for (const block of blocks) {
      if (!block || typeof block !== 'object') continue;
      const b = block as Record<string, unknown>;
      if (typeof b.html === 'string') parts.push(stripHtml(b.html));
      if (typeof b.text === 'string') parts.push(b.text);
      if (typeof b.title === 'string') parts.push(b.title);
      if (Array.isArray(b.items)) {
        for (const item of b.items) {
          if (item && typeof item === 'object') {
            const i = item as Record<string, unknown>;
            if (typeof i.title === 'string') parts.push(i.title);
            if (typeof i.html === 'string') parts.push(stripHtml(i.html));
            if (typeof i.text === 'string') parts.push(i.text);
            if (typeof i.label === 'string') parts.push(i.label);
            // Зоны кластера: название, роль и перечень объектов.
            if (typeof i.name === 'string') parts.push(i.name);
            if (typeof i.role === 'string') parts.push(i.role);
            if (Array.isArray(i.features)) {
              parts.push(...i.features.filter((f): f is string => typeof f === 'string'));
            }
          }
        }
      }
      // Организационная структура: подписи узлов.
      if (Array.isArray(b.nodes)) {
        for (const node of b.nodes) {
          if (node && typeof node === 'object') {
            const n = node as Record<string, unknown>;
            if (typeof n.title === 'string') parts.push(n.title);
            if (typeof n.subtitle === 'string') parts.push(n.subtitle);
          }
        }
      }
    }
    return parts.join(' ').slice(0, 20_000);
  }

  async index(input: IndexInput): Promise<void> {
    try {
      await this.prisma.searchDocument.upsert({
        where: {
          entity_entityId_locale: {
            entity: input.entity,
            entityId: input.entityId,
            locale: input.locale,
          },
        },
        create: {
          entity: input.entity,
          entityId: input.entityId,
          locale: input.locale,
          title: input.title,
          content: input.content,
          href: input.href,
          date: input.date ?? null,
        },
        update: {
          title: input.title,
          content: input.content,
          href: input.href,
          date: input.date ?? null,
        },
      });
    } catch (e) {
      this.logger.error(`Ошибка индексации ${input.entity}/${input.entityId}: ${(e as Error).message}`);
    }
  }

  /** Удаляет из индекса все языки сущности либо конкретный язык. */
  async remove(entity: string, entityId: string, locale?: Locale): Promise<void> {
    try {
      await this.prisma.searchDocument.deleteMany({
        where: { entity, entityId, ...(locale ? { locale } : {}) },
      });
    } catch (e) {
      this.logger.error(`Ошибка удаления из индекса: ${(e as Error).message}`);
    }
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
