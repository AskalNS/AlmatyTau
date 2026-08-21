import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ROUTES, API, type MenuItem } from '@atm/contracts';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

function buildTree(items: MenuItem[]): Array<MenuItem & { depth: number }> {
  const byParent = new Map<string | null, MenuItem[]>();
  for (const it of items) {
    const key = it.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(it);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.order - b.order);

  const out: Array<MenuItem & { depth: number }> = [];
  function walk(parentId: string | null, depth: number) {
    for (const it of byParent.get(parentId) ?? []) {
      out.push({ ...it, depth });
      walk(it.id, depth + 1);
    }
  }
  walk(null, 0);
  return out;
}

/** Пункты меню — главное и подвал (п. IV ТЗ). */
export function MenuListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-menu'],
    queryFn: () => api.get<MenuItem[]>(API.admin.menu),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(API.admin.menuItem(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-menu'] }),
  });

  const main = data ? buildTree(data.filter((i) => i.location === 'MAIN')) : [];
  const footer = data ? buildTree(data.filter((i) => i.location === 'FOOTER')) : [];

  function renderRows(rows: Array<MenuItem & { depth: number }>) {
    return rows.map((it) => {
      const ru = it.translations.find((t) => t.locale === 'ru') ?? it.translations[0];
      return (
        <tr key={it.id}>
          <td style={{ paddingLeft: 16 + it.depth * 24 }}>
            <Link to={ADMIN_ROUTES.menuEdit(it.id)} style={{ fontWeight: 600 }}>
              {ru?.title || '(без названия)'}
            </Link>
          </td>
          <td style={{ color: 'var(--s-500)', fontSize: 13 }}>
            {it.isExternal ? it.href : `/${it.href}`}
          </td>
          <td style={{ color: 'var(--s-500)', fontSize: 13 }}>{it.visibleLocales.map((l) => l.toUpperCase()).join(', ')}</td>
          <td>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link className="btn btn-secondary btn-sm" to={ADMIN_ROUTES.menuEdit(it.id)}>
                Изменить
              </Link>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (confirm(`Удалить пункт «${ru?.title}»?`)) remove.mutate(it.id);
                }}
              >
                Удалить
              </button>
            </div>
          </td>
        </tr>
      );
    });
  }

  return (
    <div>
      <PageHeader
        title="Меню"
        action={
          <Link className="btn btn-primary" to={ADMIN_ROUTES.menuNew}>
            + Добавить пункт
          </Link>
        }
      />

      {isLoading && <div style={{ color: 'var(--s-500)' }}>Загрузка…</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 16px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--s-200)' }}>
          Главное меню
        </div>
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Адрес</th>
              <th style={{ width: 140 }}>Языки</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {renderRows(main)}
            {main.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} style={{ color: 'var(--s-500)' }}>Пунктов пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div style={{ padding: '14px 16px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--s-200)' }}>
          Подвал
        </div>
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Адрес</th>
              <th style={{ width: 140 }}>Языки</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {renderRows(footer)}
            {footer.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} style={{ color: 'var(--s-500)' }}>Пунктов пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
