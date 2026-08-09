'use client';

import { useEffect, useState } from 'react';
import type { Media, Locale } from '@atm/contracts';
import { SiteImage } from './SiteMedia';
import styles from './hero.module.css';

/* ============================================================================
   Анимированный баннер главного экрана (п. 1 ТЗ).

   ТЗ требует «динамический визуальный блок (видео или анимированный баннер)
   с изображением горного ландшафта и канатных дорог». Видео Заказчик может
   загрузить не всегда, поэтому баннер работает и без него: кадры сменяют
   друг друга с медленным наездом камеры.

   Что здесь принципиально:
     * первый кадр рисует сервер обычной картинкой с priority — он остаётся
       LCP-элементом, и анимация не отодвигает отрисовку (п. VIII ТЗ);
     * остальные кадры подключаются только после события load;
     * prefers-reduced-motion полностью останавливает смену кадров и наезд —
       для части посетителей движение на экране физически некомфортно;
     * в режиме для слабовидящих анимация не запускается вовсе.
   ========================================================================== */

const FRAME_MS = 7000;

export function HeroBanner({ frames, locale }: { frames: Media[]; locale: Locale }) {
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (frames.length < 2) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const a11y = document.documentElement.dataset.a11y === 'on';
    if (reduced || a11y) return;

    const start = () => setReady(true);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
  }, [frames.length]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % frames.length);
    }, FRAME_MS);
    return () => window.clearInterval(timer);
  }, [ready, frames.length]);

  if (frames.length < 2 || !ready) return null;

  return (
    <div className={styles.banner} aria-hidden="true">
      {frames.map((frame, i) => (
        <div
          key={frame.id}
          className={styles.frame}
          data-on={i === active ? 'on' : undefined}
        >
          <SiteImage media={frame} locale={locale} sizes="100vw" className={styles.poster} />
        </div>
      ))}
    </div>
  );
}
