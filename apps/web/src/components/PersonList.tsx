'use client';

import { useState } from 'react';
import type { PublicPerson, Locale } from '@atm/contracts';
import { SiteImage } from './SiteMedia';
import styles from './person-list.module.css';

/**
 * Список членов совета с раскрытием биографии (пп. 2.2, 2.3 ТЗ).
 *
 * Карточка горизонтальная: компактный портрет слева, данные справа,
 * биография разворачивается на всю ширину карточки. Вертикальные карточки
 * с фотографией во всю ширину давали снимок в 400 px — при исходниках
 * 250–500 px он выглядел размытым, а список из девяти человек занимал
 * несколько экранов. Биография остаётся читаемой по длине строки, потому
 * что раскрывается под портретом, а не в узкой колонке рядом с ним.
 */
export function PersonList({ persons, locale }: { persons: PublicPerson[]; locale: Locale }) {
  return (
    <div className={styles.grid}>
      {persons.map((p) => (
        <PersonCard key={p.id} person={p} locale={locale} />
      ))}
    </div>
  );
}

function PersonCard({ person, locale }: { person: PublicPerson; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const hasBio = !!person.bio && person.bio.trim().length > 0;
  const more = locale === 'kk' ? 'Толығырақ' : locale === 'en' ? 'Read more' : 'Подробнее';
  const less = locale === 'kk' ? 'Жасыру' : locale === 'en' ? 'Collapse' : 'Свернуть';

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <div className={styles.photo}>
          <SiteImage media={person.photo} locale={locale} ratio="4/5" sizes="150px" />
        </div>
        <div className={styles.info}>
          <h2 className={styles.name}>{person.fullName}</h2>
          <div className={styles.position}>{person.position}</div>

          {hasBio && (
            <button className={styles.toggle} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              {open ? less : more}
              <span aria-hidden="true" className={styles.chevron} data-open={open ? 'on' : undefined}>
                ⌄
              </span>
            </button>
          )}
        </div>
      </div>

      {hasBio && open && (
        <div className={styles.bio}>
          {person
            .bio!.split('\n')
            .filter((l) => l.trim())
            .map((line, i) => (
              <p key={i}>{line}</p>
            ))}
        </div>
      )}
    </article>
  );
}
