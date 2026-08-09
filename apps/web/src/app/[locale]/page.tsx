import type { Metadata } from 'next';
import Link from 'next/link';
import type { PublicHome, Locale } from '@atm/contracts';
import { API, href as buildHref, ROUTES } from '@atm/contracts';
import { apiGet } from '@/lib/api';
import { dict, formatDate } from '@/lib/dictionary';
import { SiteImage } from '@/components/SiteMedia';
import { Hero } from '@/components/Hero';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import styles from './home.module.css';

async function getHome(locale: Locale): Promise<PublicHome> {
  return apiGet<PublicHome>(API.public.home, locale, { revalidate: 120, tags: ['home'] });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const home = await getHome(locale as Locale);
  return {
    title: home.seo.title,
    description: home.seo.description ?? undefined,
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as Locale;
  const home = await getHome(loc);
  const t = dict(loc);

  return (
    <>
      {home.sections.map((section) => {
        if (section.type === 'hero' && section.hero) {
          return <Hero key={section.id} hero={section.hero} locale={loc} />;
        }

        if (section.type === 'news') {
          return (
            <section key={section.id} className="section section-alt">
              <div className="wrap">
                <div className={styles.head}>
                  <div>
                    <div className="eyebrow">{t.news}</div>
                    <h2 className={styles.h2}>{section.title}</h2>
                  </div>
                  <Link className="btn btn-secondary" href={buildHref(loc, ROUTES.news)}>
                    {t.allNews} →
                  </Link>
                </div>
                <div className={styles.newsGrid}>
                  {home.news.map((n) => (
                    <article key={n.id} className={styles.card}>
                      <Link href={buildHref(loc, ROUTES.newsItem(n.slug))} className={styles.cardImg}>
                        <SiteImage media={n.cover} locale={loc} ratio="16/9" sizes="(max-width: 768px) 100vw, 380px" />
                      </Link>
                      <div className={styles.cardBody}>
                        <time className={styles.date}>{formatDate(n.publishedAt, loc)}</time>
                        <h3>
                          <Link href={buildHref(loc, ROUTES.newsItem(n.slug))}>{n.title}</Link>
                        </h3>
                        {n.excerpt && <p>{n.excerpt}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'partners' && home.links.length > 0) {
          return (
            <section key={section.id} className="section">
              <div className="wrap">
                <div className="eyebrow">{section.title}</div>
                <div className={styles.partners}>
                  {home.links.map((l) => (
                    <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className={styles.partner}>
                      {l.logo ? <SiteImage media={l.logo} locale={loc} /> : <span>{l.title}</span>}
                    </a>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        // Все прочие секции (about, stats, map, directions) — блочный контент.
        return (
          <section key={section.id} className={`section ${section.order % 2 ? 'section-alt' : ''}`}>
            <div className="wrap">
              {section.title && (
                <>
                  <div className="eyebrow">{section.subtitle || ''}</div>
                  <h2 className={styles.h2}>{section.title}</h2>
                </>
              )}
              {section.blocks.length > 0 && (
                <div className={styles.sectionBody}>
                  <BlockRenderer blocks={section.blocks} locale={loc} mediaMap={home.media} />
                </div>
              )}
              {section.href && (
                <Link className="btn btn-secondary" href={buildHref(loc, section.href)} style={{ marginTop: 24 }}>
                  {t.readMore} →
                </Link>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
