import type { Metadata } from 'next';
import type { PublicPerson, Locale } from '@atm/contracts';
import { API } from '@atm/contracts';
import { apiGet } from '@/lib/api';
import { dict } from '@/lib/dictionary';
import { PersonList } from '@/components/PersonList';
import styles from './board.module.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: dict(locale as Locale).board };
}

/** Правление (п. 2.2 ТЗ). */
export default async function BoardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = dict(loc);
  const persons = await apiGet<PublicPerson[]>(
    `${API.public.persons}?board=MANAGEMENT`,
    loc,
    { revalidate: 300, tags: ['persons'] },
  );

  return (
    <div className="wrap section">
      <div className="eyebrow">Almaty Tau Management</div>
      <h1 className={styles.title}>{t.board}</h1>
      <PersonList persons={persons} locale={loc} />
    </div>
  );
}
