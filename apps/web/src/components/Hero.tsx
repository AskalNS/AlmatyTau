import Link from 'next/link';
import type { PublicHero, Locale } from '@atm/contracts';
import { href as buildHref } from '@atm/contracts';
import { SiteImage } from './SiteMedia';
import { HeroVideo } from './HeroVideo';
import { HeroBanner } from './HeroBanner';
import styles from './hero.module.css';

/**
 * Главный экран (п. 1 ТЗ).
 *
 * LCP-элемент — постер-изображение (priority), а не видео: это условие
 * достижения целевых баллов PageSpeed на мобильных (п. VIII ТЗ). Видео,
 * если задано, подключает клиентский HeroVideo уже после загрузки и только
 * при videoOnMobile или на широких экранах.
 */
export function Hero({ hero, locale }: { hero: PublicHero; locale: Locale }) {
  return (
    <section className={styles.hero}>
      <div className={styles.bg}>
        {/* Первый кадр — серверный, с priority: он и есть LCP-элемент.
            Анимация и видео надстраиваются поверх уже после загрузки. */}
        <SiteImage media={hero.poster} locale={locale} priority sizes="100vw" className={styles.poster} />
        <HeroBanner frames={hero.frames} locale={locale} />
        {hero.video && <HeroVideo src={hero.video.url} poster={hero.poster?.url} onMobile={hero.videoOnMobile} />}
        <div className={styles.veil} />
      </div>

      <div className={`wrap ${styles.content}`}>
        {hero.eyebrow && <div className={styles.eyebrow}>{hero.eyebrow}</div>}
        <h1 className={styles.title}>{hero.title}</h1>
        {hero.subtitle && <p className={styles.subtitle}>{hero.subtitle}</p>}
        {/* Кнопки выводятся, только если Заказчик их задал. По замечанию
            от 28.07.2026 с главной убраны «О проекте» и «Последние новости»:
            оба раздела и так в главном меню. Пустой контейнер не рисуем —
            иначе под подзаголовком остаётся необъяснимый отступ. */}
        {(hero.primaryLabel && hero.primaryHref) || (hero.secondaryLabel && hero.secondaryHref) ? (
          <div className={styles.actions}>
            {hero.primaryLabel && hero.primaryHref && (
              <Link className="btn btn-primary" href={buildHref(locale, hero.primaryHref)}>
                {hero.primaryLabel}
              </Link>
            )}
            {hero.secondaryLabel && hero.secondaryHref && (
              <Link className={`btn ${styles.ghost}`} href={buildHref(locale, hero.secondaryHref)}>
                {hero.secondaryLabel}
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
