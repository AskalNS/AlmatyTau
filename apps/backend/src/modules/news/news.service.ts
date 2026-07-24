import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type UpsertNewsRequest,
  type News,
  type NewsQuery,
  type PublicNews,
  type PublicNewsCard,
  type Paginated,
  type Locale,
  blocksSchema,
  ROUTES,
} from '@atm/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaMapper } from '../media/media.mapper';
import { SanitizerService } from '../../common/sanitizer.service';
import { SearchIndexerService } from '../search/search-indexer.service';
import { CacheService } from '../../redis/cache.service';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { pickTranslation, availableLocales, buildSeo } from '../../common/i18n.util';

const INCLUDE = { translations: true, cover: true } satisfies Prisma.NewsInclude;
type NewsRow = Prisma.NewsGetPayload<{ include: typeof INCLUDE }>;

/**
 * Новости (п. 5.1 ТЗ): архив, сортировка по дате, поиск, закрепление.
 *
 * Разделение admin/public здесь показательно для всех контентных модулей:
 * админ видит все языки и черновики, публичное API — только опубликованное
 * и только на запрошенном языке, без фолбэка (п. III ТЗ).
 */
@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaMapper,
    private readonly sanitizer: SanitizerService,
    private readonly indexer: SearchIndexerService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  /* ----------------------------- Админка ----------------------------- */

  async adminList(query: NewsQuery): Promise<Paginated<News>> {
    const where: Prisma.NewsWhereInput = {};
    if (query.search) {
      where.translations = { some: { title: { contains: query.search, mode: 'insensitive' } } };
    }
    if (query.categoryId) where.categoryId = query.categoryId;

    const [rows, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        include: INCLUDE,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.news.count({ where }),
    ]);

    return this.paginate(rows.map((r) => this.toAdminDto(r)), total, query);
  }

  async adminGet(id: string): Promise<News> {
    const row = await this.prisma.news.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Новость не найдена');
    return this.toAdminDto(row);
  }

  async create(dto: UpsertNewsRequest, actor: AuditContext): Promise<News> {
    const row = await this.prisma.news.create({
      data: {
        slug: dto.slug,
        coverId: dto.coverId ?? null,
        categoryId: dto.categoryId ?? null,
        status: dto.status,
        publishedAt: this.resolvePublishedAt(dto),
        isPinned: dto.isPinned,
        translations: { create: dto.translations.map((t) => this.translationData(t)) },
      },
      include: INCLUDE,
    });

    await this.afterWrite(row, 'CREATE', actor);
    return this.toAdminDto(row);
  }

  async update(id: string, dto: UpsertNewsRequest, actor: AuditContext): Promise<News> {
    const existing = await this.prisma.news.findUnique({ where: { id }, include: INCLUDE });
    if (!existing) throw new NotFoundException('Новость не найдена');

    // Переводы переписываем целиком: проще и надёжнее, чем диффать по языкам.
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.newsTranslation.deleteMany({ where: { newsId: id } });
      return tx.news.update({
        where: { id },
        data: {
          slug: dto.slug,
          coverId: dto.coverId ?? null,
          categoryId: dto.categoryId ?? null,
          status: dto.status,
          publishedAt: this.resolvePublishedAt(dto),
          isPinned: dto.isPinned,
          translations: { create: dto.translations.map((t) => this.translationData(t)) },
        },
        include: INCLUDE,
      });
    });

    await this.afterWrite(row, 'UPDATE', actor);
    return this.toAdminDto(row);
  }

  async remove(id: string, actor: AuditContext): Promise<void> {
    const row = await this.prisma.news.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Новость не найдена');

    await this.prisma.news.delete({ where: { id } });
    await this.indexer.remove('news', id);
    await this.cache.invalidateTags('news', 'home', 'sitemap');
    await this.audit.record({
      action: 'DELETE',
      entity: 'news',
      entityId: id,
      entityLabel: this.label(row),
      ...actor,
    });
  }

  /* ---------------------------- Публичное ---------------------------- */

  async publicList(query: NewsQuery, locale: Locale): Promise<Paginated<PublicNewsCard>> {
    const key = `news:list:${locale}:${JSON.stringify(query)}`;
    return this.cache.wrap(key, 120, ['news'], async () => {
      const where: Prisma.NewsWhereInput = {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        // Только новости, переведённые на запрошенный язык (п. III ТЗ).
        translations: { some: { locale } },
      };
      if (query.year) {
        where.publishedAt = {
          gte: new Date(`${query.year}-01-01`),
          lt: new Date(`${query.year + 1}-01-01`),
        };
      }
      if (query.categoryId) where.categoryId = query.categoryId;
      if (query.search) {
        where.translations = { some: { locale, title: { contains: query.search, mode: 'insensitive' } } };
      }

      const [rows, total] = await Promise.all([
        this.prisma.news.findMany({
          where,
          include: INCLUDE,
          orderBy: [{ isPinned: 'desc' }, { publishedAt: query.order }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        this.prisma.news.count({ where }),
      ]);

      const items = rows
        .map((r) => this.toCard(r, locale))
        .filter((x): x is PublicNewsCard => x !== null);
      return this.paginate(items, total, query);
    });
  }

  async publicGet(slug: string, locale: Locale): Promise<PublicNews> {
    const key = `news:item:${locale}:${slug}`;
    const result = await this.cache.wrap(key, 300, ['news'], async () => {
      const row = await this.prisma.news.findUnique({ where: { slug }, include: INCLUDE });
      if (!row || row.status !== 'PUBLISHED' || (row.publishedAt && row.publishedAt > new Date())) {
        return null;
      }
      const tr = pickTranslation(row.translations, locale);
      if (!tr) return null; // нет перевода — нет страницы на этом языке

      const related = await this.prisma.news.findMany({
        where: {
          status: 'PUBLISHED',
          id: { not: row.id },
          translations: { some: { locale } },
          ...(row.categoryId ? { categoryId: row.categoryId } : {}),
        },
        include: INCLUDE,
        orderBy: { publishedAt: 'desc' },
        take: 3,
      });

      const available = availableLocales(row.translations);
      const card = this.toCard(row, locale)!;
      const dto: PublicNews = {
        ...card,
        blocks: blocksSchema.parse(tr.blocks),
        seo: buildSeo(
          { title: tr.title, seoTitle: tr.seoTitle, seoDescription: tr.seoDescription, seoNoindex: tr.seoNoindex },
          available,
          row.cover ? this.media.toDto(row.cover).url : null,
        ),
        related: related.map((r) => this.toCard(r, locale)).filter((x): x is PublicNewsCard => x !== null),
      };
      return dto;
    });

    if (!result) throw new NotFoundException('Новость не найдена');
    return result;
  }

  /* ---------------------------- helpers ------------------------------ */

  private resolvePublishedAt(dto: UpsertNewsRequest): Date | null {
    if (dto.publishedAt) return new Date(dto.publishedAt);
    // Публикуем без явной даты — ставим текущую.
    return dto.status === 'PUBLISHED' ? new Date() : null;
  }

  private translationData(t: UpsertNewsRequest['translations'][number]) {
    const blocks = this.sanitizer.cleanBlocks(blocksSchema.parse(t.blocks));
    return {
      locale: t.locale,
      title: t.title,
      excerpt: t.excerpt ?? null,
      blocks: blocks as never,
      seoTitle: t.seo?.title ?? null,
      seoDescription: t.seo?.description ?? null,
      seoOgImageId: t.seo?.ogImageId ?? null,
      seoNoindex: t.seo?.noindex ?? false,
    };
  }

  /** После создания/изменения: индексация, сброс кэша, журнал. */
  private async afterWrite(row: NewsRow, action: 'CREATE' | 'UPDATE', actor: AuditContext) {
    if (row.status === 'PUBLISHED') {
      for (const tr of row.translations) {
        await this.indexer.index({
          entity: 'news',
          entityId: row.id,
          locale: tr.locale,
          title: tr.title,
          content: `${tr.excerpt ?? ''} ${SearchIndexerService.blocksToText(tr.blocks)}`,
          href: ROUTES.newsItem(row.slug),
          date: row.publishedAt,
        });
      }
    } else {
      await this.indexer.remove('news', row.id);
    }
    await this.cache.invalidateTags('news', 'home', 'sitemap');
    await this.audit.record({
      action: row.status === 'PUBLISHED' ? 'PUBLISH' : action,
      entity: 'news',
      entityId: row.id,
      entityLabel: this.label(row),
      ...actor,
    });
  }

  private label(row: NewsRow): string {
    const ru = row.translations.find((t) => t.locale === 'ru') ?? row.translations[0];
    return ru?.title ?? row.slug;
  }

  private toAdminDto(row: NewsRow): News {
    return {
      id: row.id,
      slug: row.slug,
      coverId: row.coverId,
      status: row.status,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      isPinned: row.isPinned,
      categoryId: row.categoryId,
      translations: row.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        excerpt: t.excerpt,
        blocks: blocksSchema.parse(t.blocks),
        seo: {
          title: t.seoTitle,
          description: t.seoDescription,
          ogImageId: t.seoOgImageId,
          noindex: t.seoNoindex,
        },
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toCard(row: NewsRow, locale: Locale): PublicNewsCard | null {
    const tr = pickTranslation(row.translations, locale);
    if (!tr) return null;
    return {
      id: row.id,
      slug: row.slug,
      title: tr.title,
      excerpt: tr.excerpt,
      cover: row.cover ? this.media.toDto(row.cover) : null,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      isPinned: row.isPinned,
    };
  }

  private paginate<T>(items: T[], total: number, query: { page: number; limit: number }): Paginated<T> {
    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page * query.limit < total,
      },
    };
  }
}
