import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ROUTES, API, PUBLISH_STATUS_LABELS, LOCALES, type Vacancy } from '@atm/contracts';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

/** Вакансии (п. 4.3 ТЗ). */
export function VacanciesListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-vacancies'],
    queryFn: () => api.get<Vacancy[]>(API.admin.vacancies),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(API.admin.vacancy(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-vacancies'] }),
  });

  return (
    <div>
      <PageHeader
        title="Вакансии"
        action={
          <Link className="btn btn-primary" to={ADMIN_ROUTES.vacancyNew}>
            + Создать
          </Link>
        }
      />

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th style={{ width: 120 }}>Языки</th>
              <th style={{ width: 130 }}>Статус</th>
              <th style={{ width: 140 }}>Приём до</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ color: 'var(--s-500)' }}>Загрузка…</td>
              </tr>
            )}
            {data?.map((v) => {
              const ru = v.translations.find((t) => t.locale === 'ru') ?? v.translations[0];
              return (
                <tr key={v.id}>
                  <td>
                    <Link to={ADMIN_ROUTES.vacancyEdit(v.id)} style={{ fontWeight: 600 }}>
                      {ru?.title || '(без названия)'}
                    </Link>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {LOCALES.map((l) => {
                        const has = v.translations.some((t) => t.locale === l);
                        return (
                          <span
                            key={l}
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: has ? 'var(--green-50)' : 'var(--s-100)',
                              color: has ? 'var(--green-700)' : 'var(--s-400)',
                            }}
                          >
                            {l.toUpperCase()}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <span className={`tag tag-${v.status.toLowerCase()}`}>{PUBLISH_STATUS_LABELS[v.status]}</span>
                  </td>
                  <td style={{ color: 'var(--s-500)', fontSize: 13 }}>
                    {v.deadline ? new Date(v.deadline).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link className="btn btn-secondary btn-sm" to={ADMIN_ROUTES.vacancyEdit(v.id)}>
                        Изменить
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (confirm(`Удалить вакансию «${ru?.title}»?`)) remove.mutate(v.id);
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {data?.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: 'var(--s-500)' }}>Вакансий пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
