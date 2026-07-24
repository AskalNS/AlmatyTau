import type { Metadata } from 'next';
import type { Paginated, PublicDocument, DocumentCategory, Locale } from '@atm/contracts';
import { API } from '@atm/contracts';
import { apiGet } from '@/lib/api';
import { dict, formatDate } from '@/lib/dictionary';
import styles from './documents.module.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: dict(locale as Locale).documents };
}

function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category } = await searchParams;
  const loc = locale as Locale;
  const t = dict(loc);

  const [data, categories] = await Promise.all([
    apiGet<Paginated<PublicDocument>>(
      `${API.public.documents}?limit=100${category ? `&categoryId=${category}` : ''}`,
      loc,
      { revalidate: 180, tags: ['documents'] },
    ),
    apiGet<DocumentCategory[]>(API.public.documentCategories, loc, { revalidate: 300, tags: ['documents'] }),
  ]);

  return (
    <div className="wrap section">
      <h1 className={styles.title}>{t.documents}</h1>
      <div className={styles.layout}>
        {categories.length > 0 && (
          <nav className={styles.cats} aria-label="Категории документов">
            <a href="?" className={!category ? styles.catOn : styles.cat}>Все</a>
            {categories.map((c) => (
              <a key={c.id} href={`?category=${c.id}`} className={category === c.id ? styles.catOn : styles.cat}>
                {c.translations.find((x) => x.locale === loc)?.title || c.translations[0]?.title}
              </a>
            ))}
          </nav>
        )}
        <div className={styles.list}>
          {data.items.length === 0 && <p className={styles.empty}>{t.nothingFound}</p>}
          {data.items.map((d) => (
            <div key={d.id} className={styles.doc}>
              <span className={styles.ext} aria-hidden="true">
                {d.fileName.split('.').pop()?.toUpperCase().slice(0, 4) || 'DOC'}
              </span>
              <div className={styles.docInfo}>
                <b>{d.title}</b>
                <span>
                  {fileSize(d.fileSize)}
                  {d.documentDate ? ` · ${formatDate(d.documentDate, loc)}` : ''}
                  {d.revision > 1 ? ` · ред. ${d.revision}` : ''}
                </span>
              </div>
              <a className="btn btn-secondary" href={d.url}>
                {t.download}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
