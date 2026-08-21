import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ROUTES,
  API,
  PUBLISH_STATUS_LABELS,
  PERSON_BOARD_LABELS,
  type Person,
} from '@atm/contracts';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

/** Правление и Наблюдательный совет (пп. 2.2, 2.3 ТЗ). */
export function PersonsListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-persons'],
    queryFn: () => api.get<Person[]>(API.admin.persons),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(API.admin.person(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-persons'] }),
  });

  return (
    <div>
      <PageHeader
        title="Персоны"
        action={
          <Link className="btn btn-primary" to={ADMIN_ROUTES.personNew}>
            + Добавить
          </Link>
        }
      />

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Должность</th>
              <th style={{ width: 180 }}>Совет</th>
              <th style={{ width: 130 }}>Статус</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ color: 'var(--s-500)' }}>Загрузка…</td>
              </tr>
            )}
            {data
              ?.slice()
              .sort((a, b) => a.board.localeCompare(b.board) || a.order - b.order)
              .map((p) => {
                const ru = p.translations.find((t) => t.locale === 'ru') ?? p.translations[0];
                return (
                  <tr key={p.id}>
                    <td>
                      <Link to={ADMIN_ROUTES.personEdit(p.id)} style={{ fontWeight: 600 }}>
                        {ru?.fullName || '(без имени)'}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--s-500)', fontSize: 13 }}>{ru?.position}</td>
                    <td>{PERSON_BOARD_LABELS[p.board]}</td>
                    <td>
                      <span className={`tag tag-${p.status.toLowerCase()}`}>{PUBLISH_STATUS_LABELS[p.status]}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link className="btn btn-secondary btn-sm" to={ADMIN_ROUTES.personEdit(p.id)}>
                          Изменить
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            if (confirm(`Удалить «${ru?.fullName}»?`)) remove.mutate(p.id);
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
                <td colSpan={5} style={{ color: 'var(--s-500)' }}>Персон пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
