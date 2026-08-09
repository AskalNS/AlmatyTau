'use client';

import { useEffect, useState } from 'react';
import type { BlockOf, Locale, Media } from '@atm/contracts';
import { SiteImage } from '../SiteMedia';
import { BlockIcon } from './BlockIcon';
import styles from './blocks.module.css';

/* ============================================================================
   Подразделы с боковым меню («Общественная ценность проекта»).

   Замечания к разделу от 28.07.2026:
     - меню не читалось как навигация: активный пункт отличался только
       жирным начертанием и тонкой чертой;
     - непонятна была логика — вкладки или якоря на одной странице;
     - подразделы сливались в сплошной поток;
     - у девяти пунктов не было визуальных якорей.

   Решение — одна страница с якорями, а не подмена контента:
     * ссылка на подраздел остаётся рабочей и её можно отправить;
     * работает поиск по странице (Ctrl+F) и печать;
     * режим для слабовидящих и отключённый JS показывают материал целиком.
   Активный пункт определяется положением прокрутки и заливается фоном,
   у каждого пункта своя иконка, между подразделами — разделитель.
   ========================================================================== */

export function SectionsBlock({
  block,
  locale,
  mediaMap,
}: {
  block: BlockOf<'sections'>;
  locale: Locale;
  mediaMap: Record<string, Media>;
}) {
  const [active, setActive] = useState(block.items[0]?.anchor ?? '');

  useEffect(() => {
    const targets = block.items
      .map((i) => document.getElementById(i.anchor))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    // Считаем активным самый нижний заголовок, ушедший выше линии в трети
    // экрана. IntersectionObserver с одним порогом на длинных подразделах
    // даёт разрывы: секция во весь экран не пересекает узкую полосу.
    const onScroll = () => {
      const line = window.innerHeight / 3;
      let current = targets[0];
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= line) current = el;
      }
      setActive(current.id);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [block.items]);

  return (
    <div className={styles.sections}>
      <nav className={styles.sectionsNav} aria-label="Разделы страницы">
        <ol>
          {block.items.map((item) => (
            <li key={item.anchor}>
              <a
                href={`#${item.anchor}`}
                className={active === item.anchor ? styles.sectionsNavOn : undefined}
                aria-current={active === item.anchor ? 'true' : undefined}
              >
                <span className={styles.sectionsNavIcon}>
                  <BlockIcon name={item.icon} size={20} />
                </span>
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.sectionsBody}>
        {block.items.map((item) => {
          const media = item.mediaId ? mediaMap[item.mediaId] ?? null : null;
          return (
            <section key={item.anchor} id={item.anchor} className={styles.sectionsItem}>
              <h3 className={styles.sectionsTitle}>
                <span className={styles.sectionsTitleIcon}>
                  <BlockIcon name={item.icon} size={26} />
                </span>
                {item.title}
              </h3>
              {media && (
                <div className={styles.sectionsMedia}>
                  <SiteImage
                    media={media}
                    locale={locale}
                    ratio="16/9"
                    sizes="(max-width: 900px) 100vw, 720px"
                  />
                </div>
              )}
              <div className={styles.sectionsText} dangerouslySetInnerHTML={{ __html: item.html }} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
