import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type PublicHome,
  type PublicHomeSection,
  type PublicHero,
  type HomeSection,
  type UpdateHomeSectionRequest,
  type Locale,
  blocksSchema,
  collectMediaIds,
  collectDocumentIds,
} from '@atm/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaMapper } from '../media/media.mapper';
import { CacheService } from '../../redis/cache.service';
import { NewsService } from '../news/news.service';
import { LinksService } from '../links/links.service';
import { SettingsService } from '../settings/settings.service';
import { DocumentsService } from '../documents/documents.service';
import { SanitizerService } from '../../common/sanitizer.service';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { pickTranslation } from '../../common/i18n.util';

const INCLUDE = {
  translations: true,
  heroPoster: true,
  heroVideo: true,
} satisfies Prisma.HomeSectionInclude;
type SectionRow = Prisma.HomeSectionGetPayload<{ include: typeof INCLUDE }>;

/**
 * Главная страница (п. 1 ТЗ).
 *
 * Собирает секции из БД (их состав и порядок редактируются — п. IV),
 * подмешивает свежую ленту новостей и партнёрские ссылки. Всё одним
 * закэшированным ответом, чтобы главная не делала пачку запросов.
 */
@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaMapper,
    private readonly cache: CacheService,
    private readonly news: NewsService,
    private readonly links: LinksService,
    private readonly settings: SettingsService,
    private readonly documents: DocumentsService,
    private readonly sanitizer: SanitizerService,
    private readonly audit: AuditService,
  ) {}

  /** Секции для редактора — все переводы разом, без сведения к одному языку. */
  async adminList(): Promise<HomeSection[]> {
    const rows = await this.prisma.homeSection.findMany({
      include: INCLUDE,
      orderBy: { order: 'asc' },
    });
    return rows.map((r) => this.toAdminDto(r));
  }

  /**
   * Редактирование существующей секции: тексты, фото в блоках, кадры
   * баннера, видимость. Состав секций (их типы и число) не меняется здесь —
   * он задан при наполнении сайта, см. комментарий у updateHomeSectionRequestSchema.
   */
  async update(id: string, dto: UpdateHomeSectionRequest, actor: AuditContext): Promise<HomeSection> {
    const existing = await this.prisma.homeSection.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Секция не найдена');

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.homeSectionTranslation.deleteMany({ where: { sectionId: id } });
      return tx.homeSection.update({
        where: { id },
        data: {
          isVisible: dto.isVisible,
          heroPosterId: dto.heroPosterId ?? null,
          heroVideoId: dto.heroVideoId ?? null,
          videoOnMobile: dto.videoOnMobile,
          href: dto.href ?? null,
          translations: {
            create: dto.translations.map((t) => ({
              locale: t.locale,
              eyebrow: t.eyebrow ?? null,
              title: t.title ?? null,
              subtitle: t.subtitle ?? null,
              blocks: this.sanitizer.cleanBlocks(blocksSchema.parse(t.blocks)) as never,
              primaryLabel: t.primaryLabel ?? null,
              primaryHref: t.primaryHref ?? null,
              secondaryLabel: t.secondaryLabel ?? null,
              secondaryHref: t.secondaryHref ?? null,
            })),
          },
        },
        include: INCLUDE,
      });
    });

    await this.cache.invalidateTags('home');
    await this.audit.record({
      action: 'UPDATE',
      entity: 'home_section',
      entityId: row.id,
      entityLabel: this.label(row),
      ...actor,
    });
    return this.toAdminDto(row);
  }

  private label(row: SectionRow): string {
    const tr = row.translations.find((t) => t.locale === 'ru') ?? row.translations[0];
    return tr?.title || row.type;
  }

  private toAdminDto(row: SectionRow): HomeSection {
    return {
      id: row.id,
      type: row.type as HomeSection['type'],
      order: row.order,
      isVisible: row.isVisible,
      heroPosterId: row.heroPosterId,
      heroVideoId: row.heroVideoId,
      videoOnMobile: row.videoOnMobile,
      href: row.href,
      translations: row.translations.map((t) => ({
        locale: t.locale,
        eyebrow: t.eyebrow,
        title: t.title,
        subtitle: t.subtitle,
        blocks: blocksSchema.parse(t.blocks),
        primaryLabel: t.primaryLabel,
        primaryHref: t.primaryHref,
        secondaryLabel: t.secondaryLabel,
        secondaryHref: t.secondaryHref,
      })),
    };
  }

  async publicHome(locale: Locale): Promise<PublicHome> {
    return this.cache.wrap(`home:${locale}`, 120, ['home', 'news', 'links'], async () => {
      const [sectionRows, newsCount] = await Promise.all([
        this.prisma.homeSection.findMany({
          where: { isVisible: true },
          include: INCLUDE,
          orderBy: { order: 'asc' },
        }),
        this.settings.homeNewsCount(),
      ]);

      const sections = sectionRows
        .map((r) => this.toSection(r, locale))
        .filter((x): x is PublicHomeSection => x !== null);

      const media = await this.media.mapForBlocks(
        this.prisma.media,
        collectMediaIds(sections.flatMap((s) => s.blocks)),
      );
      const documents = await this.documents.mapForBlocks(
        collectDocumentIds(sections.flatMap((s) => s.blocks)),
        locale,
      );

      // Кадры анимированного баннера — из блока «Галерея» секции «Главный
      // экран». Постер идёт первым: он же LCP-элемент и запасной вариант,
      // когда анимация отключена настройками системы.
      const heroSection = sections.find((s) => s.type === 'hero');
      if (heroSection?.hero) {
        const gallery = heroSection.blocks.find((b) => b.type === 'gallery');
        const frames = gallery
          ? gallery.mediaIds.map((id) => media[id]).filter((m): m is NonNullable<typeof m> => !!m)
          : [];
        heroSection.hero.frames = heroSection.hero.poster
          ? [heroSection.hero.poster, ...frames.filter((f) => f.id !== heroSection.hero!.poster!.id)]
          : frames;
      }

      const newsList = await this.news.publicList(
        { page: 1, limit: newsCount, order: 'desc' } as never,
        locale,
      );
      const links = await this.links.publicList(locale, 'PARTNERS').catch(() => []);
      const govLinks = await this.links.publicList(locale, 'GOVERNMENT').catch(() => []);

      const heroTr = sectionRows.find((s) => s.type === 'hero')?.translations.find((t) => t.locale === locale);

      return {
        sections,
        news: newsList.items,
        links: [...links, ...govLinks],
        media,
        documents,
        seo: {
          title: heroTr?.title ?? 'ТОО «Almaty Tau Management»',
          description: heroTr?.subtitle ?? null,
          ogImage: null,
          noindex: false,
          // Главная существует на всех включённых языках.
          availableLocales: ['kk', 'ru', 'en'],
        },
      };
    });
  }

  private toSection(row: SectionRow, locale: Locale): PublicHomeSection | null {
    const tr = pickTranslation(row.translations, locale);
    if (!tr) return null;

    let hero: PublicHero | null = null;
    if (row.type === 'hero') {
      hero = {
        eyebrow: tr.eyebrow,
        title: tr.title ?? '',
        subtitle: tr.subtitle,
        poster: row.heroPoster ? this.media.toDto(row.heroPoster) : null,
        video: row.heroVideo ? this.media.toDto(row.heroVideo) : null,
        // Заполняется в publicHome, когда собран словарь медиа.
        frames: [],
        videoOnMobile: row.videoOnMobile,
        primaryLabel: tr.primaryLabel,
        primaryHref: tr.primaryHref,
        secondaryLabel: tr.secondaryLabel,
        secondaryHref: tr.secondaryHref,
      };
    }

    return {
      id: row.id,
      type: row.type,
      order: row.order,
      title: tr.title,
      subtitle: tr.subtitle,
      hero,
      blocks: blocksSchema.parse(tr.blocks),
      href: row.href,
    };
  }
}
