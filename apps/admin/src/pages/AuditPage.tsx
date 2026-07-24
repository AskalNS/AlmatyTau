import { useQuery } from '@tanstack/react-query';
import {
  API,
  AUDIT_ACTION_LABELS,
  type Paginated,
  type AuditEntry,
} from '@atm/contracts';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

/** Журнал действий пользователей (п. X.IV ТЗ). Только администратор. */
export function AuditPage() {
  const { data } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => api.get<Paginated<AuditEntry>>(`${API.admin.audit}?limit=100`),
  });

  return (
    <div>
      <PageHeader title="Журнал действий" />
      <div className="card">
        <table>
          <thead>
            <tr>
              <th style={{ width: 150 }}>Время</th>
              <th>Пользователь</th>
              <th>Действие</th>
              <th>Объект</th>
              <th style={{ width: 130 }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((e) => (
              <tr key={e.id}>
                <td style={{ color: 'var(--s-500)', fontSize: 13 }}>
                  {new Date(e.createdAt).toLocaleString('ru-RU')}
                </td>
                <td>
                  {e.userName || '—'}
                  {e.userEmail && <div style={{ fontSize: 12, color: 'var(--s-500)' }}>{e.userEmail}</div>}
                </td>
                <td>
                  <span
                    style={{
                      color: e.action === 'LOGIN_FAILED' || e.action === 'ACCOUNT_LOCKED' ? 'var(--red)' : 'inherit',
                    }}
                  >
                    {AUDIT_ACTION_LABELS[e.action]}
                  </span>
                </td>
                <td style={{ fontSize: 13 }}>{e.entityLabel || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--s-500)', fontFamily: 'monospace' }}>{e.ip || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
