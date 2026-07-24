import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type UpsertPageRequest,
  type Page,
  type PublicPage,
  type Locale,
  blocksSchema,
} from '@atm/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaMapper } from '../media/media.mapper';
import { SanitizerService } from '../../common/sanitizer.service';
import { SearchIndexerService } from '../search/search-indexer.service';
import { CacheService } from '../../redis/cache.service';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { pickTranslation, availableLocales, buildSeo } from '../../common/i18n.util';

const INCLUDE = { translations: true, cover: true } satisfies Prisma.PageInclude;
type PageRow = Prisma.PageGetPayload<{ include: typeof INCLUDE }>;

/**
 * Блочные страницы разделов (пп. 2.1, 2.4, 3, 4.2 ТЗ).
 *
 * Адресуются по полю path (company/about, project), а не по id: так
 * публичный роут напрямую отражает структуру сайта, а меню ссылается
 * на страницу человекочитаемым путём.
 */
@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaMapper,
    private readonly sanitizer: SanitizerService,
    private readonly indexer: SearchIndexerService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  async adminList(): Promise<Page[]> {
    const rows = await this.prisma.page.findMany({
      include: INCLUDE,
      orderBy: [{ path: 'asc' }],
    });
    return rows.map((r) => this.toAdminDto(r));
  }

  async adminGet(id: string): Promise<Page> {
    const row = await this.prisma.page.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Страница не найдена');
    return this.toAdminDto(row);
  }

  async create(dto: UpsertPageRequest, actor: AuditContext): Promise<Page> {
    const clash = await this.prisma.page.findUnique({ where: { path: dto.path } });
    if (clash) throw new BadRequestException('Страница с таким адресом уже существует');

    const row = await this.prisma.page.create({
      data: {
        path: dto.path,
        parentId: dto.parentId ?? null,
        coverId: dto.coverId ?? null,
        status: dto.status,
        order: dto.order,
        translations: { create: dto.translations.map((t) => this.trData(t)) },
      },
      include: INCLUDE,
    });
    await this.afterWrite(row, 'CREATE', actor);
    return this.toAdminDto(row);
  }

  async update(id: string, dto: UpsertPageRequest, actor: AuditContext): Promise<Page> {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Страница не найдена');

    // Системным страницам (контакты, поиск, политика) нельзя менять path:
    // на них завязаны роуты и навигация.
    const path = existing.isSystem ? existing.path : dto.path;

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.pageTranslation.deleteMany({ where: { pageId: id } });
      return tx.page.update({
        where: { id },
        data: {
          path,
          parentId: dto.parentId ?? null,
          coverId: dto.coverId ?? null,
          status: dto.status,
          order: dto.order,
          translations: { create: dto.translations.map((t) => this.trData(t)) },
        },
        include: INCLUDE,
      });
    });
    await this.afterWrite(row, 'UPDATE', actor);
    return this.toAdminDto(row);
  }

  async remove(id: string, actor: AuditContext): Promise<void> {
    const row = await this.prisma.page.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Страница не найдена');
    if (row.isSystem) {
      throw new BadRequestException('Системную страницу удалить нельзя, можно только изменить содержимое');
    }
    await this.prisma.page.delete({ where: { id } });
    await this.indexer.remove('page', id);
    await this.cache.invalidateTags('pages', 'sitemap');
    await this.audit.record({
      action: 'DELETE', entity: 'page', entityId: id, entityLabel: this.label(row), ...actor,
    });
  }

  async publicGet(path: string, locale: Locale): Promise<PublicPage> {
    const key = `page:${locale}:${path}`;
    const result = await this.cache.wrap(key, 300, ['pages'], async () => {
      const row = await this.prisma.page.findUnique({ where: { path }, include: INCLUDE });
      if (!row || row.status !== 'PUBLISHED') return null;
      const tr = pickTranslation(row.translations, locale);
      if (!tr) return null;

      const dto: PublicPage = {
        id: row.id,
        path: row.path,
        title: tr.title,
        lead: tr.lead,
        cover: row.cover ? this.media.toDto(row.cover) : null,
        blocks: blocksSchema.parse(tr.blocks),
        seo: buildSeo(
          { title: tr.title, seoTitle: tr.seoTitle, seoDescription: tr.seoDescription, seoNoindex: tr.seoNoindex },
          availableLocales(row.translations),
          row.cover ? this.media.toDto(row.cover).url : null,
        ),
        updatedAt: row.updatedAt.toISOString(),
      };
      return dto;
    });
    if (!result) throw new NotFoundException('Страница не найдена');
    return result;
  }

  private trData(t: UpsertPageRequest['translations'][number]) {
    const blocks = this.sanitizer.cleanBlocks(blocksSchema.parse(t.blocks));
    return {
      locale: t.locale,
      title: t.title,
      lead: t.lead ?? null,
      blocks: blocks as never,
      seoTitle: t.seo?.title ?? null,
      seoDescription: t.seo?.description ?? null,
      seoOgImageId: t.seo?.ogImageId ?? null,
      seoNoindex: t.seo?.noindex ?? false,
    };
  }

  private async afterWrite(row: PageRow, action: 'CREATE' | 'UPDATE', actor: AuditContext) {
    if (row.status === 'PUBLISHED') {
      for (const tr of row.translations) {
        await this.indexer.index({
          entity: 'page', entityId: row.id, locale: tr.locale, title: tr.title,
          content: `${tr.lead ?? ''} ${SearchIndexerService.blocksToText(tr.blocks)}`,
          href: row.path, date: null,
        });
      }
    } else {
      await this.indexer.remove('page', row.id);
    }
    await this.cache.invalidateTags('pages', 'sitemap');
    await this.audit.record({
      action: row.status === 'PUBLISHED' ? 'PUBLISH' : action,
      entity: 'page', entityId: row.id, entityLabel: this.label(row), ...actor,
    });
  }

  private label(row: PageRow): string {
    return (row.translations.find((t) => t.locale === 'ru') ?? row.translations[0])?.title ?? row.path;
  }

  private toAdminDto(row: PageRow): Page {
    return {
      id: row.id,
      path: row.path,
      parentId: row.parentId,
      coverId: row.coverId,
      status: row.status,
      isSystem: row.isSystem,
      order: row.order,
      translations: row.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        lead: t.lead,
        blocks: blocksSchema.parse(t.blocks),
        seo: { title: t.seoTitle, description: t.seoDescription, ogImageId: t.seoOgImageId, noindex: t.seoNoindex },
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
