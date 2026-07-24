import type { Metadata } from 'next';
import Link from 'next/link';
import type { Paginated, PublicNewsCard, Locale } from '@atm/contracts';
import { API, href as buildHref, ROUTES } from '@atm/contracts';
import { apiGet } from '@/lib/api';
import { dict, formatDate } from '@/lib/dictionary';
import { SiteImage } from '@/components/SiteMedia';
import styles from './news.module.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: dict(locale as Locale).news };
}

export default async function NewsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page } = await searchParams;
  const loc = locale as Locale;
  const t = dict(loc);
  const p = Math.max(1, Number(page) || 1);

  const data = await apiGet<Paginated<PublicNewsCard>>(
    `${API.public.news}?page=${p}&limit=9`,
    loc,
    { revalidate: 120, tags: ['news'] },
  );

  return (
    <div className="wrap section">
      <div className="eyebrow">{dict(loc).news}</div>
      <h1 className={styles.title}>{t.news}</h1>

      {data.items.length === 0 ? (
        <p className={styles.empty}>{t.nothingFound}</p>
      ) : (
        <div className={styles.grid}>
          {data.items.map((n) => (
            <article key={n.id} className={styles.card}>
              <Link href={buildHref(loc, ROUTES.newsItem(n.slug))} className={styles.img}>
                <SiteImage media={n.cover} locale={loc} ratio="16/9" sizes="(max-width: 900px) 100vw, 380px" />
              </Link>
              <div className={styles.body}>
                <time className={styles.date}>{formatDate(n.publishedAt, loc)}</time>
                <h2 className={styles.cardTitle}>
                  <Link href={buildHref(loc, ROUTES.newsItem(n.slug))}>{n.title}</Link>
                </h2>
                {n.excerpt && <p>{n.excerpt}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      {data.meta.totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Навигация по страницам">
          {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`${buildHref(loc, ROUTES.news)}?page=${n}`}
              className={n === p ? styles.pageOn : styles.page}
              aria-current={n === p ? 'page' : undefined}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
