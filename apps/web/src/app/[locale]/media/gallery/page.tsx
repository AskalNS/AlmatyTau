import type { Metadata } from 'next';
import Link from 'next/link';
import type { PublicAlbumCard, Locale } from '@atm/contracts';
import { API, ROUTES, href as buildHref } from '@atm/contracts';
import { apiGet } from '@/lib/api';
import { dict } from '@/lib/dictionary';
import { SiteImage } from '@/components/SiteMedia';
import styles from './gallery.module.css';

/**
 * Медиагалерея (п. 5.2 ТЗ).
 *
 * Раздел отдавал 404: в схеме БД альбомы были, а API и страниц не существовало.
 * Список альбомов, внутри альбома — сетка с просмотром по клику.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: dict(locale as Locale).gallery };
}

function countLabel(n: number, locale: Locale): string {
  if (locale === 'kk') return `${n} файл`;
  if (locale === 'en') return `${n} ${n === 1 ? 'photo' : 'photos'}`;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} фотография`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} фотографии`;
  return `${n} фотографий`;
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = dict(loc);

  const albums = await apiGet<PublicAlbumCard[]>(API.public.albums, loc, {
    revalidate: 300,
    tags: ['albums'],
  });

  return (
    <div className="wrap section">
      <h1 className={styles.title}>{t.gallery}</h1>

      {albums.length === 0 ? (
        <p className={styles.empty}>{t.nothingFound}</p>
      ) : (
        <div className={styles.grid}>
          {albums.map((a) => (
            <Link key={a.id} className={styles.card} href={buildHref(loc, ROUTES.album(a.slug))}>
              <span className={styles.cover}>
                <SiteImage
                  media={a.cover}
                  locale={loc}
                  ratio="4/3"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <span className={styles.count}>{countLabel(a.count, loc)}</span>
              </span>
              <span className={styles.body}>
                <b>{a.title}</b>
                {a.description && <span>{a.description}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
