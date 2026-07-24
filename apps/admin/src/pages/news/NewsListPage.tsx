import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ROUTES,
  API,
  PUBLISH_STATUS_LABELS,
  LOCALES,
  type Paginated,
  type News,
} from '@atm/contracts';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

/** Список новостей с индикаторами перевода по языкам (п. III ТЗ). */
export function NewsListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => api.get<Paginated<News>>(`${API.admin.news}?limit=50`),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(API.admin.newsItem(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-news'] }),
  });

  return (
    <div>
      <PageHeader
        title="Новости"
        action={
          <Link className="btn btn-primary" to={ADMIN_ROUTES.newsNew}>
            + Создать
          </Link>
        }
      />

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Заголовок</th>
              <th style={{ width: 120 }}>Языки</th>
              <th style={{ width: 130 }}>Статус</th>
              <th style={{ width: 120 }}>Дата</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ color: 'var(--s-500)' }}>Загрузка…</td>
              </tr>
            )}
            {data?.items.map((n) => {
              const ru = n.translations.find((t) => t.locale === 'ru') ?? n.translations[0];
              return (
                <tr key={n.id}>
                  <td>
                    <Link to={ADMIN_ROUTES.newsEdit(n.id)} style={{ fontWeight: 600 }}>
                      {ru?.title || '(без заголовка)'}
                    </Link>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {LOCALES.map((l) => {
                        const has = n.translations.some((t) => t.locale === l);
                        return (
                          <span
                            key={l}
                            title={has ? 'Переведено' : 'Нет перевода'}
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
                    <span className={`tag tag-${n.status.toLowerCase()}`}>
                      {PUBLISH_STATUS_LABELS[n.status]}
                    </span>
                  </td>
                  <td style={{ color: 'var(--s-500)', fontSize: 13 }}>
                    {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link className="btn btn-secondary btn-sm" to={ADMIN_ROUTES.newsEdit(n.id)}>
                        Изменить
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (confirm(`Удалить новость «${ru?.title}»?`)) remove.mutate(n.id);
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: 'var(--s-500)' }}>Новостей пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
