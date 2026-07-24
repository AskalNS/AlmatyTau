'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './hero.module.css';

/**
 * Фоновое видео главного экрана.
 *
 * Загружается ТОЛЬКО после полной загрузки страницы и не ранее — постер уже
 * отрисован как LCP. На мобильных по умолчанию не подключается (экономия
 * трафика и CPU, п. VIII ТЗ), если явно не разрешено videoOnMobile.
 * prefers-reduced-motion полностью отключает видео.
 */
export function HeroVideo({
  src,
  poster,
  onMobile,
}: {
  src: string;
  poster?: string;
  onMobile: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (reduced) return;
    if (isMobile && !onMobile) return;

    // Ждём полной загрузки, чтобы видео не конкурировало с LCP.
    const start = () => setShow(true);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
  }, [onMobile]);

  if (!show) return null;

  return (
    <video
      ref={ref}
      className={styles.video}
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      preload="none"
    >
      <source src={src} />
    </video>
  );
}
