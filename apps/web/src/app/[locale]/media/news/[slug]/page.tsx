import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { PublicNews, Locale } from '@atm/contracts';
import { API, LOCALE_HTML_LANG, href as buildHref, ROUTES } from '@atm/contracts';
import { apiGetOrNull } from '@/lib/api';
import { dict, formatDate } from '@/lib/dictionary';
import { SiteImage } from '@/components/SiteMedia';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import styles from '../news.module.css';

async function getNews(slug: string, locale: Locale) {
  return apiGetOrNull<PublicNews>(API.public.newsItem(slug), locale, { revalidate: 300, tags: ['news'] });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const news = await getNews(slug, locale as Locale);
  if (!news) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://atm.kz';
  // hreflang по языкам, на которых новость реально существует (п. III, IX ТЗ).
  const languages: Record<string, string> = {};
  for (const l of news.seo.availableLocales) {
    languages[LOCALE_HTML_LANG[l]] = `${siteUrl}${buildHref(l, ROUTES.newsItem(slug))}`;
  }

  return {
    title: news.seo.title,
    description: news.seo.description ?? undefined,
    alternates: { languages },
    openGraph: {
      title: news.seo.title,
      description: news.seo.description ?? undefined,
      images: news.cover ? [news.cover.url] : undefined,
      type: 'article',
    },
    robots: news.seo.noindex ? { index: false } : undefined,
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const news = await getNews(slug, loc);
  if (!news) notFound();
  const t = dict(loc);

  return (
    <article className="wrap" style={{ paddingTop: 32, paddingBottom: 56 }}>
      <nav className={styles.breadcrumb} aria-label="Хлебные крошки">
        <Link href={buildHref(loc, ROUTES.home)}>{t.home}</Link>
        {' / '}
        <Link href={buildHref(loc, ROUTES.news)}>{t.news}</Link>
      </nav>

      <div className={styles.article}>
        <h1 className={styles.articleTitle}>{news.title}</h1>
        <div className={styles.meta}>
          <time>{formatDate(news.publishedAt, loc)}</time>
        </div>
      </div>

      {news.cover && (
        <div className={styles.cover}>
          <SiteImage media={news.cover} locale={loc} priority sizes="(max-width: 900px) 100vw, 1180px" ratio="16/9" />
        </div>
      )}

      <div className={styles.articleBody}>
        <BlockRenderer blocks={news.blocks} locale={loc} mediaMap={news.media} documentsMap={news.documents} />
      </div>

      {news.related.length > 0 && (
        <section className={styles.related}>
          <h2 className={styles.relatedTitle}>{t.relatedNews}</h2>
          <div className={styles.grid}>
            {news.related.map((n) => (
              <article key={n.id} className={styles.card}>
                <Link href={buildHref(loc, ROUTES.newsItem(n.slug))} className={styles.img}>
                  <SiteImage media={n.cover} locale={loc} ratio="16/9" sizes="(max-width: 900px) 100vw, 380px" />
                </Link>
                <div className={styles.body}>
                  <time className={styles.date}>{formatDate(n.publishedAt, loc)}</time>
                  <h3 className={styles.cardTitle}>
                    <Link href={buildHref(loc, ROUTES.newsItem(n.slug))}>{n.title}</Link>
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
