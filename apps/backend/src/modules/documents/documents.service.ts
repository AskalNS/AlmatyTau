import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type UpsertDocumentRequest,
  type Document,
  type DocumentCategory,
  type PublicDocument,
  type DocumentQuery,
  type Paginated,
  type Locale,
} from '@atm/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../media/storage.service';
import { SearchIndexerService } from '../search/search-indexer.service';
import { CacheService } from '../../redis/cache.service';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { pickTranslation } from '../../common/i18n.util';

const INCLUDE = {
  translations: true,
  file: true,
  category: { include: { translations: true } },
} satisfies Prisma.DocumentInclude;
type DocRow = Prisma.DocumentGetPayload<{ include: typeof INCLUDE }>;

/**
 * Внутренние нормативные документы (п. 4.1 ТЗ): категории, поиск, версии.
 *
 * Ключевая деталь — версионность: при замене файла увеличивается revision,
 * но id документа и его публичная ссылка сохраняются. На внутренние НПА
 * ссылаются из писем и других документов, и эти ссылки не должны рваться.
 */
@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly indexer: SearchIndexerService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  /* --- категории --- */

  async listCategories(): Promise<DocumentCategory[]> {
    const rows = await this.prisma.documentCategory.findMany({
      include: { translations: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      order: c.order,
      translations: c.translations.map((t) => ({ locale: t.locale, title: t.title })),
    }));
  }

  /* --- админка --- */

  async adminList(query: DocumentQuery): Promise<Paginated<Document>> {
    const where: Prisma.DocumentWhereInput = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.search) {
      where.translations = { some: { title: { contains: query.search, mode: 'insensitive' } } };
    }
    const [rows, total] = await Promise.all([
      this.prisma.document.findMany({
        where, include: INCLUDE,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit, take: query.limit,
      }),
      this.prisma.document.count({ where }),
    ]);
    return this.paginate(rows.map((r) => this.toAdminDto(r)), total, query);
  }

  async create(dto: UpsertDocumentRequest, actor: AuditContext): Promise<Document> {
    const file = await this.prisma.media.findUnique({ where: { id: dto.fileId } });
    if (!file) throw new BadRequestException('Файл не найден. Сначала загрузите документ.');

    const row = await this.prisma.document.create({
      data: {
        categoryId: dto.categoryId ?? null,
        fileId: dto.fileId,
        fileName: file.originalName,
        fileSize: file.size,
        fileMime: file.mime,
        documentDate: dto.documentDate ? new Date(dto.documentDate) : null,
        status: dto.status,
        order: dto.order,
        translations: { create: dto.translations.map((t) => ({ ...t })) },
      },
      include: INCLUDE,
    });
    await this.afterWrite(row, 'CREATE', actor);
    return this.toAdminDto(row);
  }

  async update(id: string, dto: UpsertDocumentRequest, actor: AuditContext): Promise<Document> {
    const existing = await this.prisma.document.findUnique({ where: { id }, include: INCLUDE });
    if (!existing) throw new NotFoundException('Документ не найден');

    // Файл сменился — это новая редакция. revision++, ссылка на документ та же.
    const fileChanged = dto.fileId !== existing.fileId;
    const file = fileChanged
      ? await this.prisma.media.findUnique({ where: { id: dto.fileId } })
      : existing.file;
    if (!file) throw new BadRequestException('Файл не найден');

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.documentTranslation.deleteMany({ where: { documentId: id } });
      return tx.document.update({
        where: { id },
        data: {
          categoryId: dto.categoryId ?? null,
          fileId: dto.fileId,
          fileName: file.originalName,
          fileSize: file.size,
          fileMime: file.mime,
          documentDate: dto.documentDate ? new Date(dto.documentDate) : null,
          revision: fileChanged ? { increment: 1 } : undefined,
          status: dto.status,
          order: dto.order,
          translations: { create: dto.translations.map((t) => ({ ...t })) },
        },
        include: INCLUDE,
      });
    });
    await this.afterWrite(row, 'UPDATE', actor);
    return this.toAdminDto(row);
  }

  async remove(id: string, actor: AuditContext): Promise<void> {
    const row = await this.prisma.document.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Документ не найден');
    await this.prisma.document.delete({ where: { id } });
    await this.indexer.remove('document', id);
    await this.cache.invalidateTags('documents');
    await this.audit.record({ action: 'DELETE', entity: 'document', entityId: id, entityLabel: this.label(row), ...actor });
  }

  /* --- публичное --- */

  async publicList(query: DocumentQuery, locale: Locale): Promise<Paginated<PublicDocument>> {
    const key = `documents:${locale}:${JSON.stringify(query)}`;
    return this.cache.wrap(key, 180, ['documents'], async () => {
      const where: Prisma.DocumentWhereInput = {
        status: 'PUBLISHED',
        translations: { some: { locale } },
      };
      if (query.categoryId) where.categoryId = query.categoryId;
      if (query.search) {
        where.translations = { some: { locale, title: { contains: query.search, mode: 'insensitive' } } };
      }
      const [rows, total] = await Promise.all([
        this.prisma.document.findMany({
          where, include: INCLUDE, orderBy: [{ order: 'asc' }, { documentDate: 'desc' }],
          skip: (query.page - 1) * query.limit, take: query.limit,
        }),
        this.prisma.document.count({ where }),
      ]);
      const items = rows.map((r) => this.toPublic(r, locale)).filter((x): x is PublicDocument => x !== null);
      return this.paginate(items, total, query);
    });
  }

  /**
   * Словарь документов по id для блока `file` в блочном контенте.
   *
   * Тот же приём, что MediaMapper.mapForBlocks: блок хранит только
   * идентификаторы, отсутствующий/неопубликованный документ просто не
   * попадает в словарь — фронт покажет остальные, страница не падает.
   */
  async mapForBlocks(ids: string[], locale: Locale): Promise<Record<string, PublicDocument>> {
    if (ids.length === 0) return {};
    const rows = await this.prisma.document.findMany({
      where: { id: { in: ids }, status: 'PUBLISHED' },
      include: INCLUDE,
    });
    const result: Record<string, PublicDocument> = {};
    for (const row of rows) {
      const dto = this.toPublic(row, locale);
      if (dto) result[row.id] = dto;
    }
    return result;
  }

  /** Данные для отдачи файла напрямую с бэкенда (см. DocumentsController.download). */
  async getDownloadInfo(id: string): Promise<{ storageKey: string; fileName: string; fileMime: string }> {
    const row = await this.prisma.document.findUnique({ where: { id }, include: { file: true } });
    if (!row || row.status !== 'PUBLISHED') throw new NotFoundException('Документ не найден');
    return { storageKey: row.file.storageKey, fileName: row.fileName, fileMime: row.fileMime };
  }

  private async afterWrite(row: DocRow, action: 'CREATE' | 'UPDATE', actor: AuditContext) {
    if (row.status === 'PUBLISHED') {
      for (const tr of row.translations) {
        await this.indexer.index({
          entity: 'document', entityId: row.id, locale: tr.locale,
          title: tr.title, content: tr.description ?? '',
          href: 'corporate/documents', date: row.documentDate,
        });
      }
    } else {
      await this.indexer.remove('document', row.id);
    }
    await this.cache.invalidateTags('documents');
    await this.audit.record({
      action: row.status === 'PUBLISHED' ? 'PUBLISH' : action,
      entity: 'document', entityId: row.id, entityLabel: this.label(row), ...actor,
    });
  }

  private label(row: DocRow): string {
    return (row.translations.find((t) => t.locale === 'ru') ?? row.translations[0])?.title ?? row.fileName;
  }

  private toAdminDto(row: DocRow): Document {
    return {
      id: row.id, categoryId: row.categoryId, fileId: row.fileId,
      fileName: row.fileName, fileSize: row.fileSize, fileMime: row.fileMime,
      documentDate: row.documentDate?.toISOString() ?? null,
      revision: row.revision, status: row.status, order: row.order,
      translations: row.translations.map((t) => ({ locale: t.locale, title: t.title, description: t.description })),
      createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toPublic(row: DocRow, locale: Locale): PublicDocument | null {
    const tr = pickTranslation(row.translations, locale);
    if (!tr) return null;
    const cat = row.category
      ? {
          id: row.category.id,
          slug: row.category.slug,
          title: (row.category.translations.find((t) => t.locale === locale) ?? row.category.translations[0])?.title ?? '',
        }
      : null;
    return {
      id: row.id, title: tr.title, description: tr.description,
      // Стабильная ссылка на скачивание — не подписанный URL, а роут API,
      // который выдаёт свежую подпись при каждом обращении.
      url: `/api/public/documents/${row.id}/download`,
      fileName: row.fileName, fileSize: row.fileSize, fileMime: row.fileMime,
      documentDate: row.documentDate?.toISOString() ?? null,
      revision: row.revision, category: cat,
    };
  }

  private paginate<T>(items: T[], total: number, q: { page: number; limit: number }): Paginated<T> {
    return {
      items,
      meta: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit), hasNext: q.page * q.limit < total },
    };
  }
}
