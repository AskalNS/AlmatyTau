import type { Metadata } from 'next';
import type { PublicVacancy, Locale } from '@atm/contracts';
import { API } from '@atm/contracts';
import { apiGet } from '@/lib/api';
import { dict, formatDate } from '@/lib/dictionary';
import styles from './vacancies.module.css';

/**
 * Вакансии (п. 4.3 ТЗ).
 *
 * Страницы не было вовсе — пункт меню «Вакансии» отдавал 404, хотя API
 * и админская часть готовы. Список плоский: вакансий у компании штата
 * на 16 человек единицы, отдельная страница на каждую избыточна, поэтому
 * требования и условия раскрываются прямо в карточке.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: dict(locale as Locale).vacancies };
}

export default async function VacanciesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = dict(loc);

  const items = await apiGet<PublicVacancy[]>(API.public.vacancies, loc, {
    revalidate: 180,
    tags: ['vacancies'],
  });

  return (
    <div className="wrap section">
      <h1 className={styles.title}>{t.vacancies}</h1>

      {items.length === 0 ? (
        <p className={styles.empty}>
          {loc === 'kk'
            ? 'Қазіргі уақытта ашық бос лауазымдар жоқ. Жаңа хабарландырулар осы бетте жарияланады.'
            : loc === 'en'
              ? 'There are no open vacancies at the moment. New openings are published on this page.'
              : 'Открытых вакансий сейчас нет. Новые объявления публикуются на этой странице.'}
        </p>
      ) : (
        <div className={styles.list}>
          {items.map((v) => (
            <article key={v.id} className={styles.card}>
              <header className={styles.head}>
                <h2 className={styles.name}>{v.title}</h2>
                {v.department && <div className={styles.dept}>{v.department}</div>}
              </header>

              <dl className={styles.meta}>
                {v.deadline && (
                  <div>
                    <dt>
                      {loc === 'kk' ? 'Құжаттарды қабылдау мерзімі' : loc === 'en' ? 'Application deadline' : 'Срок приёма документов'}
                    </dt>
                    <dd>{formatDate(v.deadline, loc)}</dd>
                  </div>
                )}
                {v.publishedAt && (
                  <div>
                    <dt>{loc === 'kk' ? 'Жарияланды' : loc === 'en' ? 'Published' : 'Опубликовано'}</dt>
                    <dd>{formatDate(v.publishedAt, loc)}</dd>
                  </div>
                )}
              </dl>

              {v.responsibilities && (
                <Section
                  title={loc === 'kk' ? 'Міндеттері' : loc === 'en' ? 'Responsibilities' : 'Обязанности'}
                  text={v.responsibilities}
                />
              )}
              {v.requirements && (
                <Section
                  title={loc === 'kk' ? 'Талаптар' : loc === 'en' ? 'Requirements' : 'Требования'}
                  text={v.requirements}
                />
              )}
              {v.conditions && (
                <Section
                  title={loc === 'kk' ? 'Жағдайлар' : loc === 'en' ? 'Conditions' : 'Условия'}
                  text={v.conditions}
                />
              )}

              {v.contactEmail && (
                <a className="btn btn-primary" href={`mailto:${v.contactEmail}`}>
                  {loc === 'kk' ? 'Түйіндеме жіберу' : loc === 'en' ? 'Send your CV' : 'Отправить резюме'}
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/** Многострочный текст из админки превращаем в абзацы. */
function Section({ title, text }: { title: string; text: string }) {
  return (
    <section className={styles.block}>
      <h3>{title}</h3>
      {text
        .split('\n')
        .filter((l) => l.trim())
        .map((line, i) => (
          <p key={i}>{line}</p>
        ))}
    </section>
  );
}
