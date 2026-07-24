'use client';

import { useState } from 'react';
import type { PublicPerson, Locale } from '@atm/contracts';
import { SiteImage } from './SiteMedia';
import styles from './person-list.module.css';

/**
 * Список членов совета с раскрытием биографии (пп. 2.2, 2.3 ТЗ).
 *
 * Клиентский компонент из-за раскрывающегося блока «Подробнее» — так задумано
 * в исходном документе. Биография хранится многострочным текстом; переводим
 * переносы строк в абзацы.
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
      <div className={styles.photo}>
        <SiteImage media={person.photo} locale={locale} ratio="4/5" sizes="(max-width: 768px) 100vw, 300px" />
      </div>
      <div className={styles.body}>
        <h2 className={styles.name}>{person.fullName}</h2>
        <div className={styles.position}>{person.position}</div>

        {hasBio && (
          <>
            <button className={styles.toggle} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              {open ? less : more}
            </button>
            {open && (
              <div className={styles.bio}>
                {person.bio!.split('\n').filter((l) => l.trim()).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
