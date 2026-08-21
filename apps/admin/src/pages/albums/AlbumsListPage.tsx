import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ROUTES, API, PUBLISH_STATUS_LABELS, type Album } from '@atm/contracts';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

/** Медиагалерея — альбомы фото и видео (п. 5.2, VI ТЗ). */
export function AlbumsListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-albums'],
    queryFn: () => api.get<Album[]>(API.admin.albums),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(API.admin.album(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-albums'] }),
  });

  return (
    <div>
      <PageHeader
        title="Медиагалерея"
        action={
          <Link className="btn btn-primary" to={ADMIN_ROUTES.albumNew}>
            + Создать альбом
          </Link>
        }
      />

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th style={{ width: 100 }}>Файлов</th>
              <th style={{ width: 130 }}>Статус</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} style={{ color: 'var(--s-500)' }}>Загрузка…</td>
              </tr>
            )}
            {data?.map((a) => {
              const ru = a.translations.find((t) => t.locale === 'ru') ?? a.translations[0];
              return (
                <tr key={a.id}>
                  <td>
                    <Link to={ADMIN_ROUTES.albumEdit(a.id)} style={{ fontWeight: 600 }}>
                      {ru?.title || '(без названия)'}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--s-500)', fontSize: 13 }}>{a.mediaIds.length}</td>
                  <td>
                    <span className={`tag tag-${a.status.toLowerCase()}`}>{PUBLISH_STATUS_LABELS[a.status]}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link className="btn btn-secondary btn-sm" to={ADMIN_ROUTES.albumEdit(a.id)}>
                        Изменить
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (confirm(`Удалить альбом «${ru?.title}»?`)) remove.mutate(a.id);
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
                <td colSpan={4} style={{ color: 'var(--s-500)' }}>Альбомов пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
