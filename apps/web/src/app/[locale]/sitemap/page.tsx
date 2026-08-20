import type { Metadata } from 'next';
import Link from 'next/link';
import type { PublicLayout, Locale } from '@atm/contracts';
import { API, ROUTES, href as buildHref } from '@atm/contracts';
import { apiGet } from '@/lib/api';
import { dict } from '@/lib/dictionary';
import styles from './sitemap.module.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: dict(locale as Locale).sitemap };
}

/**
 * Карта сайта (п. IV.6 ТЗ): человеко-читаемая, а не sitemap.xml для
 * поисковиков (тот отдаётся отдельно, см. app/sitemap.xml/route.ts).
 *
 * Рендерит то же меню, что Header/Footer (API.public.layout), целиком —
 * без обрезки до двух групп, как в футере — и без CMS-страницы: раздел
 * всегда синхронен с реальной навигацией сайта.
 */
export default async function SitemapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = dict(loc);

  const layout = await apiGet<PublicLayout>(API.public.layout, loc, { revalidate: 300, tags: ['layout'] });

  return (
    <div className="wrap section">
      <h1 className={styles.title}>{t.sitemap}</h1>

      <ul className={styles.groups}>
        <li className={styles.group}>
          <Link href={buildHref(loc, ROUTES.home)} className={styles.groupTitle}>
            {t.home}
          </Link>
        </li>
        {layout.mainMenu
          .filter((node) => node.href !== '')
          .map((node) => (
            <li key={node.id} className={styles.group}>
              {node.isExternal ? (
                <a href={node.href} className={styles.groupTitle}>
                  {node.title}
                </a>
              ) : (
                <Link href={buildHref(loc, node.href)} className={styles.groupTitle}>
                  {node.title}
                </Link>
              )}
              {node.children.length > 0 && (
                <ul className={styles.children}>
                  {node.children.map((child) => (
                    <li key={child.id}>
                      {child.isExternal ? (
                        <a href={child.href}>{child.title}</a>
                      ) : (
                        <Link href={buildHref(loc, child.href)}>{child.title}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
