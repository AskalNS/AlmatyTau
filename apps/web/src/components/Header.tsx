import Link from 'next/link';
import type { PublicMenuNode, PublicSettings, Locale } from '@atm/contracts';
import { LOCALE_SHORT, LOCALES, href as buildHref, ROUTES } from '@atm/contracts';
import { dict } from '@/lib/dictionary';
import { LogoMark } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileNav } from './MobileNav';
import styles from './header.module.css';

/**
 * Шапка сайта.
 *
 * Родительские пункты меню кликабельны и ведут на страницу-хаб (п. IV ТЗ):
 * выпадающий список раскрывается по наведению и фокусу, но сам пункт
 * остаётся доступной ссылкой — иначе раздел недостижим с клавиатуры.
 */
export function Header({
  menu,
  settings,
  locale,
  path,
}: {
  menu: PublicMenuNode[];
  settings: PublicSettings;
  locale: Locale;
  path: string;
}) {
  const t = dict(locale);

  return (
    <header className={styles.header}>
      <a className="skip-link" href="#main">
        {locale === 'kk' ? 'Негізгі мазмұнға өту' : locale === 'en' ? 'Skip to main content' : 'К основному содержимому'}
      </a>

      <div className={styles.top}>
        <div className={`wrap ${styles.topInner}`}>
          <span className={styles.topAddr}>{settings.address}</span>
          <span className={styles.spacer} />
          <Link className={styles.a11yLink} href={`${buildHref(locale, path)}?a11y=on`}>
            ◐ {t.a11y}
          </Link>
          <Link className={styles.searchLink} href={buildHref(locale, ROUTES.search)}>
            ⌕ {t.search}
          </Link>
          <LanguageSwitcher locale={locale} path={path} />
        </div>
      </div>

      <div className={styles.main}>
        <div className={`wrap ${styles.mainInner}`}>
          <Link href={buildHref(locale, ROUTES.home)} className={styles.logo} aria-label={settings.organizationName}>
            <LogoMark />
            <span className={styles.logoName}>
              ALMATY TAU<br />MANAGEMENT
              <small>{locale === 'kk' ? 'Алматы тау кластері' : locale === 'en' ? 'Almaty Mountain Cluster' : 'Алматинский горный кластер'}</small>
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Основная навигация">
            {menu.map((item) => (
              <NavItem key={item.id} item={item} locale={locale} />
            ))}
          </nav>

          <MobileNav menu={menu} locale={locale} />
        </div>
      </div>
    </header>
  );
}

function NavItem({ item, locale }: { item: PublicMenuNode; locale: Locale }) {
  const to = item.isExternal ? item.href : buildHref(locale, item.href);
  const hasChildren = item.children.length > 0;

  if (!hasChildren) {
    return (
      <Link className={styles.navLink} href={to}>
        {item.title}
      </Link>
    );
  }

  return (
    <div className={styles.navGroup}>
      <Link className={`${styles.navLink} ${styles.navParent}`} href={to} aria-haspopup="true">
        {item.title}
        <span aria-hidden="true"> ▾</span>
      </Link>
      <div className={styles.dropdown}>
        {item.children.map((child) => (
          <Link
            key={child.id}
            className={styles.dropdownLink}
            href={child.isExternal ? child.href : buildHref(locale, child.href)}
          >
            {child.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export { LOCALE_SHORT, LOCALES };
