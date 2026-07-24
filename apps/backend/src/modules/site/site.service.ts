import { Injectable } from '@nestjs/common';
import {
  type PublicLayout,
  type SitemapEntry,
  type Locale,
  LOCALES,
  ROUTES,
} from '@atm/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../redis/cache.service';
import { MenuService } from '../menu/menu.service';
import { SettingsService } from '../settings/settings.service';
import { availableLocales } from '../../common/i18n.util';

/**
 * Каркас сайта одним запросом: меню + настройки + список языков.
 *
 * Публичный сайт запрашивает это один раз на layout вместо трёх отдельных
 * обращений (меню, подвал, настройки), что заметно ускоряет первую отрисовку.
 */
@Injectable()
export class SiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly menu: MenuService,
    private readonly settings: SettingsService,
  ) {}

  async layout(locale: Locale): Promise<PublicLayout> {
    return this.cache.wrap(`layout:${locale}`, 300, ['layout'], async () => {
      const [mainMenu, footerMenu, settings] = await Promise.all([
        this.menu.publicTree('MAIN', locale),
        this.menu.publicTree('FOOTER', locale),
        this.settings.publicGet(locale),
      ]);
      return { mainMenu, footerMenu, settings, locales: [...LOCALES] };
    });
  }

  /**
   * Данные для sitemap.xml (п. IX ТЗ).
   *
   * Каждая страница попадает по одному разу на каждый язык, на котором она
   * реально переведена, с перечнем alternate-языков для hreflang.
   */
  async sitemap(): Promise<SitemapEntry[]> {
    return this.cache.wrap('sitemap:all', 600, ['sitemap'], async () => {
      const entries: SitemapEntry[] = [];

      const push = (
        path: string,
        locales: Locale[],
        updatedAt: Date,
        priority: number,
        changefreq: SitemapEntry['changefreq'],
      ) => {
        for (const locale of locales) {
          entries.push({
            path,
            locale,
            updatedAt: updatedAt.toISOString(),
            alternates: locales,
            priority,
            changefreq,
          });
        }
      };

      // Статические маршруты — на всех языках.
      const all: Locale[] = [...LOCALES];
      const now = new Date();
      push(ROUTES.home, all, now, 1.0, 'daily');
      push(ROUTES.project, all, now, 0.9, 'weekly');
      push(ROUTES.news, all, now, 0.9, 'daily');
      push(ROUTES.gallery, all, now, 0.7, 'weekly');
      push(ROUTES.documents, all, now, 0.6, 'weekly');
      push(ROUTES.vacancies, all, now, 0.7, 'weekly');
      push(ROUTES.contacts, all, now, 0.6, 'monthly');

      // Опубликованные страницы.
      const pages = await this.prisma.page.findMany({
        where: { status: 'PUBLISHED' },
        include: { translations: { select: { locale: true } } },
      });
      for (const p of pages) {
        const locales = availableLocales(p.translations);
        if (locales.length) push(p.path, locales, p.updatedAt, 0.7, 'monthly');
      }

      // Новости.
      const news = await this.prisma.news.findMany({
        where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
        include: { translations: { select: { locale: true } } },
      });
      for (const n of news) {
        const locales = availableLocales(n.translations);
        if (locales.length) push(ROUTES.newsItem(n.slug), locales, n.updatedAt, 0.6, 'monthly');
      }

      // Вакансии и персоны — по тому же принципу.
      const vacancies = await this.prisma.vacancy.findMany({
        where: { status: 'PUBLISHED' },
        include: { translations: { select: { locale: true } } },
      });
      for (const v of vacancies) {
        const locales = availableLocales(v.translations);
        if (locales.length) push(ROUTES.vacancy(v.slug), locales, v.updatedAt, 0.5, 'weekly');
      }

      const persons = await this.prisma.person.findMany({
        where: { status: 'PUBLISHED' },
        include: { translations: { select: { locale: true } } },
      });
      for (const p of persons) {
        const locales = availableLocales(p.translations);
        const base = p.board === 'MANAGEMENT' ? 'company/board' : 'company/supervisory-board';
        if (locales.length) push(`${base}/${p.slug}`, locales, p.updatedAt, 0.4, 'monthly');
      }

      return entries;
    });
  }
}
