'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Media, Locale } from '@atm/contracts';
import { SiteImage } from './SiteMedia';
import styles from './album.module.css';

/**
 * Сетка альбома с просмотром снимка на весь экран.
 *
 * Свой просмотрщик, а не библиотека: нужен только показ, стрелки и Esc,
 * зато без внешнего скрипта на странице (пп. VIII, X.III ТЗ). Управление
 * с клавиатуры и фокус на кнопке закрытия — требование доступности:
 * без них модальное окно становится ловушкой для клавиатуры.
 */
export function AlbumGrid({ items, locale }: { items: Media[]; locale: Locale }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (delta: number) => setOpen((i) => (i === null ? null : (i + delta + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    // Фон не должен прокручиваться под открытым снимком.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, step]);

  const label = (m: Media) => m.alt[locale] || m.alt.ru || '';

  return (
    <>
      <ul className={styles.grid}>
        {items.map((m, i) => (
          <li key={m.id}>
            <button type="button" className={styles.cell} onClick={() => setOpen(i)}>
              <SiteImage media={m} locale={locale} ratio="1/1" sizes="(max-width: 768px) 45vw, 260px" />
              <span className={styles.zoom} aria-hidden="true">
                ⤢
              </span>
              <span className="visually-hidden">
                {locale === 'kk' ? 'Үлкейту' : locale === 'en' ? 'Enlarge' : 'Увеличить'}
                {label(m) ? `: ${label(m)}` : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={label(items[open])}>
          <button type="button" className={styles.close} onClick={close} autoFocus aria-label="Закрыть">
            ✕
          </button>
          {items.length > 1 && (
            <button type="button" className={styles.prev} onClick={() => step(-1)} aria-label="Предыдущий">
              ‹
            </button>
          )}
          <figure className={styles.figure}>
            <SiteImage media={items[open]} locale={locale} sizes="90vw" priority />
            {label(items[open]) && <figcaption>{label(items[open])}</figcaption>}
            <span className={styles.counter}>
              {open + 1} / {items.length}
            </span>
          </figure>
          {items.length > 1 && (
            <button type="button" className={styles.next} onClick={() => step(1)} aria-label="Следующий">
              ›
            </button>
          )}
          <button type="button" className={styles.backdrop} onClick={close} tabIndex={-1} aria-hidden="true" />
        </div>
      )}
    </>
  );
}
