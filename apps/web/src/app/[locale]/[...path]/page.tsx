import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PublicPage, Locale } from '@atm/contracts';
import { API, LOCALE_HTML_LANG, href as buildHref } from '@atm/contracts';
import { apiGetOrNull } from '@/lib/api';
import { SiteImage } from '@/components/SiteMedia';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import styles from './page.module.css';

/**
 * Блочная страница разделов (пп. 2.1, 2.4, 3, 4.2 ТЗ).
 *
 * Ловит любой путь, не перехваченный более специфичными маршрутами
 * (новости, галерея, вакансии — у них свои страницы). Содержимое приходит
 * из API по path и рисуется блоками. Next отдаёт приоритет конкретным
 * сегментам, поэтому catch-all срабатывает только для настоящих страниц.
 */
async function getPage(path: string, locale: Locale) {
  return apiGetOrNull<PublicPage>(API.public.page(path), locale, {
    revalidate: 300,
    tags: ['pages'],
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; path: string[] }>;
}): Promise<Metadata> {
  const { locale, path } = await params;
  const page = await getPage(path.join('/'), locale as Locale);
  if (!page) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://atm.kz';
  const languages: Record<string, string> = {};
  for (const l of page.seo.availableLocales) {
    languages[LOCALE_HTML_LANG[l]] = `${siteUrl}${buildHref(l, page.path)}`;
  }

  return {
    title: page.seo.title,
    description: page.seo.description ?? undefined,
    alternates: { languages },
    robots: page.seo.noindex ? { index: false } : undefined,
  };
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ locale: string; path: string[] }>;
}) {
  const { locale, path } = await params;
  const loc = locale as Locale;
  const page = await getPage(path.join('/'), loc);
  if (!page) notFound();

  return (
    <>
      {page.cover && (
        <div className={styles.cover}>
          <SiteImage media={page.cover} locale={loc} priority sizes="100vw" ratio="21/9" />
        </div>
      )}
      <div className="wrap section">
        <header className={styles.header}>
          <h1 className={styles.title}>{page.title}</h1>
          {page.lead && <p className={styles.lead}>{page.lead}</p>}
        </header>
        <div className={styles.body}>
          <BlockRenderer blocks={page.blocks} locale={loc} mediaMap={page.media} />
        </div>
      </div>
    </>
  );
}
