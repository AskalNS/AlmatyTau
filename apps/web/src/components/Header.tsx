import Link from 'next/link';
import type { PublicMenuNode, PublicSettings, Locale } from '@atm/contracts';
import { LOCALE_SHORT, LOCALES, href as buildHref, ROUTES } from '@atm/contracts';
import { dict } from '@/lib/dictionary';
import { LogoMark } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { A11yLink } from './A11yLink';
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
          {/* Адрес в верхней строке не выводится: по замечанию Заказчика
              от 28.07.2026 он остаётся только в подвале. */}
          <span className={styles.spacer} />
          <A11yLink className={styles.a11yLink} label={t.a11y} />
          {/* Версия для незрячих (замечание Заказчика от 19.08.2026, п. 9):
              внешний экранный диктор, по примеру screenreader.tilqazyna.kz —
              свой экранный диктор сайт не реализует. */}
          <a
            className={styles.a11yLink}
            href="https://screenreader.tilqazyna.kz/#download"
            target="_blank"
            rel="noopener noreferrer"
          >
            ◉ {t.screenReader}
          </a>
          <Link className={styles.searchLink} href={buildHref(locale, ROUTES.search)}>
            ⌕ {t.search}
          </Link>
          <LanguageSwitcher locale={locale} path={path} />
        </div>
      </div>

      <div className={styles.main}>
        <div className={`wrap ${styles.mainInner}`}>
          {/* Подпись «Алматинский горный кластер» рядом с логотипом убрана
              по замечанию Заказчика от 19.08.2026 (п. 2). */}
          <Link href={buildHref(locale, ROUTES.home)} className={styles.logo} aria-label={settings.organizationName}>
            <LogoMark height={42} />
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
