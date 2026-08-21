import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ROUTES, API, PUBLISH_STATUS_LABELS, LOCALES, type Page } from '@atm/contracts';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

/** Список страниц сайта (п. IV, V ТЗ — создание и редактирование страниц). */
export function PagesListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-pages'],
    queryFn: () => api.get<Page[]>(API.admin.pages),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(API.admin.page(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pages'] }),
  });

  return (
    <div>
      <PageHeader
        title="Страницы"
        action={
          <Link className="btn btn-primary" to={ADMIN_ROUTES.pageEdit('new')}>
            + Создать
          </Link>
        }
      />

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Заголовок</th>
              <th>Адрес</th>
              <th style={{ width: 120 }}>Языки</th>
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
            {data?.map((p) => {
              const ru = p.translations.find((t) => t.locale === 'ru') ?? p.translations[0];
              return (
                <tr key={p.id}>
                  <td>
                    <Link to={ADMIN_ROUTES.pageEdit(p.id)} style={{ fontWeight: 600 }}>
                      {ru?.title || '(без заголовка)'}
                    </Link>
                    {p.isSystem && (
                      <span className="tag tag-draft" style={{ marginLeft: 8 }}>
                        системная
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--s-500)', fontSize: 13 }}>/{p.path}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {LOCALES.map((l) => {
                        const has = p.translations.some((t) => t.locale === l);
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
                    <span className={`tag tag-${p.status.toLowerCase()}`}>{PUBLISH_STATUS_LABELS[p.status]}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link className="btn btn-secondary btn-sm" to={ADMIN_ROUTES.pageEdit(p.id)}>
                        Изменить
                      </Link>
                      {!p.isSystem && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            if (confirm(`Удалить страницу «${ru?.title}»?`)) remove.mutate(p.id);
                          }}
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {data?.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: 'var(--s-500)' }}>Страниц пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
