import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { PublicAlbum, Locale } from '@atm/contracts';
import { API, ROUTES, href as buildHref } from '@atm/contracts';
import { apiGetOrNull } from '@/lib/api';
import { dict } from '@/lib/dictionary';
import { AlbumGrid } from '@/components/AlbumGrid';
import styles from '../gallery.module.css';

async function getAlbum(slug: string, locale: Locale) {
  return apiGetOrNull<PublicAlbum>(API.public.album(slug), locale, {
    revalidate: 300,
    tags: ['albums'],
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const album = await getAlbum(slug, locale as Locale);
  if (!album) return {};
  return { title: album.title, description: album.description ?? undefined };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const album = await getAlbum(slug, loc);
  if (!album) notFound();
  const t = dict(loc);

  return (
    <div className="wrap section">
      <Link className={styles.back} href={buildHref(loc, ROUTES.gallery)}>
        ← {t.gallery}
      </Link>
      <h1 className={styles.title}>{album.title}</h1>
      {album.description && <p className={styles.lead}>{album.description}</p>}
      <AlbumGrid items={album.items} locale={loc} />
    </div>
  );
}
