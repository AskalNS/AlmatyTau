import Link from 'next/link';
import type { PublicMenuNode, PublicSettings, Locale } from '@atm/contracts';
import { href as buildHref, ROUTES } from '@atm/contracts';
import { dict } from '@/lib/dictionary';
import { LogoMark } from './Logo';
import styles from './footer.module.css';

/** Подвал (п. IV ТЗ): контакты, ссылки на разделы, политика конфиденциальности. */
export function Footer({
  menu,
  settings,
  locale,
}: {
  menu: PublicMenuNode[];
  settings: PublicSettings;
  locale: Locale;
}) {
  const t = dict(locale);
  const year = 2026;

  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.cols}>
          <div>
            <Link href={buildHref(locale, ROUTES.home)} className={styles.logo}>
              <LogoMark light height={40} />
            </Link>
            {settings.footerText && <p className={styles.about}>{settings.footerText}</p>}
          </div>

          {menu.slice(0, 2).map((group) => (
            <div key={group.id}>
              <h4>{group.title}</h4>
              {group.children.map((c) => (
                <Link key={c.id} href={c.isExternal ? c.href : buildHref(locale, c.href)}>
                  {c.title}
                </Link>
              ))}
            </div>
          ))}

          <div>
            <h4>{t.contacts}</h4>
            {settings.address && <p className={styles.contactLine}>{settings.address}</p>}
            {settings.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/[^+\d]/g, '')}`}>{p}</a>
            ))}
            {settings.emails.map((e) => (
              <a key={e} href={`mailto:${e}`}>{e}</a>
            ))}
            {settings.workingHours && <p className={styles.hours}>{settings.workingHours}</p>}
          </div>
        </div>

        <div className={styles.bottom}>
          <span>© {year} {settings.organizationName}</span>
          <span className={styles.spacer} />
          <Link href={buildHref(locale, ROUTES.privacy)}>
            {locale === 'kk' ? 'Құпиялылық саясаты' : locale === 'en' ? 'Privacy Policy' : 'Политика конфиденциальности'}
          </Link>
          <Link href={buildHref(locale, ROUTES.sitemap)}>
            {locale === 'kk' ? 'Сайт картасы' : locale === 'en' ? 'Sitemap' : 'Карта сайта'}
          </Link>
        </div>
      </div>
    </footer>
  );
}
