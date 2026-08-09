import { Injectable } from '@nestjs/common';
import {
  type PublicHome,
  type PublicHomeSection,
  type PublicHero,
  type Locale,
  blocksSchema,
  collectMediaIds,
} from '@atm/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaMapper } from '../media/media.mapper';
import { CacheService } from '../../redis/cache.service';
import { NewsService } from '../news/news.service';
import { LinksService } from '../links/links.service';
import { SettingsService } from '../settings/settings.service';
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
  ) {}

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
