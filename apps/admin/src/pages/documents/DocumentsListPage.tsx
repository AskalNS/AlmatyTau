import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ROUTES,
  API,
  PUBLISH_STATUS_LABELS,
  type Paginated,
  type Document,
  type DocumentCategory,
} from '@atm/contracts';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

/** Документы и файлы (п. 4.1 ТЗ). */
export function DocumentsListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-documents'],
    queryFn: () => api.get<Paginated<Document>>(`${API.admin.documents}?limit=100`),
  });
  const { data: categories } = useQuery({
    queryKey: ['admin-document-categories'],
    queryFn: () => api.get<DocumentCategory[]>(API.admin.documentCategories),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(API.admin.document(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-documents'] }),
  });

  const categoryTitle = (id: string | null) => {
    if (!id) return '—';
    const c = categories?.find((c) => c.id === id);
    const ru = c?.translations.find((t) => t.locale === 'ru') ?? c?.translations[0];
    return ru?.title ?? '—';
  };

  return (
    <div>
      <PageHeader
        title="Документы"
        action={
          <Link className="btn btn-primary" to={ADMIN_ROUTES.documentEdit('new')}>
            + Загрузить
          </Link>
        }
      />

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th style={{ width: 200 }}>Категория</th>
              <th style={{ width: 100 }}>Файл</th>
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
            {data?.items.map((d) => {
              const ru = d.translations.find((t) => t.locale === 'ru') ?? d.translations[0];
              return (
                <tr key={d.id}>
                  <td>
                    <Link to={ADMIN_ROUTES.documentEdit(d.id)} style={{ fontWeight: 600 }}>
                      {ru?.title || '(без названия)'}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--s-500)', fontSize: 13 }}>{categoryTitle(d.categoryId)}</td>
                  <td style={{ color: 'var(--s-500)', fontSize: 13 }}>{formatSize(d.fileSize)}</td>
                  <td>
                    <span className={`tag tag-${d.status.toLowerCase()}`}>{PUBLISH_STATUS_LABELS[d.status]}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link className="btn btn-secondary btn-sm" to={ADMIN_ROUTES.documentEdit(d.id)}>
                        Изменить
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (confirm(`Удалить документ «${ru?.title}»?`)) remove.mutate(d.id);
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
                <td colSpan={5} style={{ color: 'var(--s-500)' }}>Документов пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
