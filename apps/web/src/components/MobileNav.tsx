'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PublicMenuNode, Locale } from '@atm/contracts';
import { href as buildHref } from '@atm/contracts';
import styles from './mobilenav.module.css';

/** Мобильное меню. Единственный клиентский компонент шапки — нужен стейт. */
export function MobileNav({ menu, locale }: { menu: PublicMenuNode[]; locale: Locale }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={styles.burger}
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <nav className={styles.panel} aria-label="Мобильная навигация">
          {menu.map((item) => (
            <div key={item.id} className={styles.group}>
              <Link
                href={item.isExternal ? item.href : buildHref(locale, item.href)}
                className={styles.link}
                onClick={() => setOpen(false)}
              >
                {item.title}
              </Link>
              {item.children.map((child) => (
                <Link
                  key={child.id}
                  href={child.isExternal ? child.href : buildHref(locale, child.href)}
                  className={styles.childLink}
                  onClick={() => setOpen(false)}
                >
                  {child.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      )}
    </>
  );
}
