'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './feedback.module.css';

/**
 * Карта на странице контактов (п. 6, VI ТЗ).
 *
 * Провайдер — 2ГИС (в РК стабильнее Google). Карта загружается лениво
 * при попадании в зону видимости, чтобы не тянуть внешний скрипт на первый
 * экран и не терять баллы PageSpeed (п. VIII ТЗ). До загрузки показывается
 * статичная заглушка с адресом.
 */
export function ContactMap({
  lat,
  lng,
  address,
}: {
  lat: number | null;
  lng: number | null;
  address: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || lat == null || lng == null) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [lat, lng]);

  return (
    <div ref={ref} className={styles.mapWrap}>
      {visible && lat != null && lng != null ? (
        <iframe
          title="Карта расположения офиса"
          className={styles.mapFrame}
          loading="lazy"
          src={`https://yandex.ru/map-widget/v1/?ll=${lng}%2C${lat}&z=16&pt=${lng},${lat}`}
          allowFullScreen
        />
      ) : (
        <div className={styles.mapPlaceholder}>
          <div className={styles.mapPin} aria-hidden="true" />
          <b>{address}</b>
        </div>
      )}
    </div>
  );
}
