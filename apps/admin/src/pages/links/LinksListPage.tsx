import { Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ROUTES, API, LINK_GROUP_LABELS, type Link } from '@atm/contracts';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

/** Внешние ссылки: госорганы, партнёры, госзакупки и прочее (п. VI ТЗ). */
export function LinksListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-links'],
    queryFn: () => api.get<Link[]>(API.admin.links),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(API.admin.link(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-links'] }),
  });

  return (
    <div>
      <PageHeader
        title="Ссылки"
        action={
          <RouterLink className="btn btn-primary" to={ADMIN_ROUTES.linkNew}>
            + Добавить
          </RouterLink>
        }
      />

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Адрес</th>
              <th style={{ width: 200 }}>Группа</th>
              <th style={{ width: 100 }}>Активна</th>
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
              .sort((a, b) => a.order - b.order)
              .map((l) => {
                const ru = l.translations.find((t) => t.locale === 'ru') ?? l.translations[0];
                return (
                  <tr key={l.id}>
                    <td>
                      <RouterLink to={ADMIN_ROUTES.linkEdit(l.id)} style={{ fontWeight: 600 }}>
                        {ru?.title || '(без названия)'}
                      </RouterLink>
                    </td>
                    <td style={{ color: 'var(--s-500)', fontSize: 13 }}>{l.url}</td>
                    <td>{LINK_GROUP_LABELS[l.group]}</td>
                    <td>
                      <span className={`tag ${l.isActive ? 'tag-published' : 'tag-draft'}`}>
                        {l.isActive ? 'Да' : 'Нет'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <RouterLink className="btn btn-secondary btn-sm" to={ADMIN_ROUTES.linkEdit(l.id)}>
                          Изменить
                        </RouterLink>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            if (confirm(`Удалить ссылку «${ru?.title}»?`)) remove.mutate(l.id);
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
                <td colSpan={5} style={{ color: 'var(--s-500)' }}>Ссылок пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
