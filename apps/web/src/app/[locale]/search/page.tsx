import type { Metadata } from 'next';
import Link from 'next/link';
import type { Paginated, SearchResult, Locale } from '@atm/contracts';
import { API, SEARCH_TYPE_LABELS, href as buildHref } from '@atm/contracts';
import { apiGetOrNull } from '@/lib/api';
import { dict, formatDate } from '@/lib/dictionary';
import styles from './search.module.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: dict(locale as Locale).search, robots: { index: false } };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const loc = locale as Locale;
  const t = dict(loc);
  const query = (q || '').trim();

  const data =
    query.length >= 2
      ? await apiGetOrNull<Paginated<SearchResult>>(
          `${API.public.search}?q=${encodeURIComponent(query)}`,
          loc,
          { revalidate: 0 },
        )
      : null;

  return (
    <div className="wrap section">
      <h1 className={styles.title}>{t.search}</h1>

      <form className={styles.form} action={buildHref(loc, 'search')} method="get">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={t.searchPlaceholder}
          aria-label={t.search}
          autoFocus
        />
        <button className="btn btn-primary" type="submit">
          {t.search}
        </button>
      </form>

      {query.length >= 2 && data && (
        <>
          <p className={styles.count}>
            {t.nothingFound === 'Ничего не найдено' && data.meta.total === 0
              ? t.nothingFound
              : `${data.meta.total}`}
          </p>
          <div className={styles.results}>
            {data.items.map((r) => (
              <article key={`${r.type}-${r.id}`} className={styles.result}>
                <span className="tag">{SEARCH_TYPE_LABELS[r.type]}</span>
                <h2>
                  <Link href={r.href}>{r.title}</Link>
                </h2>
                {/* snippet содержит <mark> из ts_headline — безопасен, это наш HTML */}
                <p dangerouslySetInnerHTML={{ __html: r.snippet }} />
                {r.date && <time className={styles.date}>{formatDate(r.date, loc)}</time>}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
