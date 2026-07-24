import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  API,
  ROLE_LABELS,
  type User,
  type InviteUserRequest,
  type Role,
} from '@atm/contracts';
import { api, ApiRequestError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

/** Управление пользователями. Только администратор (п. V ТЗ). */
export function UsersPage() {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<User[]>(API.admin.users),
  });

  const setActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(API.admin.user(id), { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const unlock = useMutation({
    mutationFn: (id: string) => api.post(`${API.admin.user(id)}/unlock`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div>
      <PageHeader
        title="Пользователи"
        action={
          <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
            + Пригласить
          </button>
        }
      />

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>E-mail</th>
              <th style={{ width: 140 }}>Роль</th>
              <th style={{ width: 100 }}>2FA</th>
              <th style={{ width: 120 }}>Статус</th>
              <th style={{ width: 200 }}></th>
            </tr>
          </thead>
          <tbody>
            {data?.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ color: 'var(--s-600)' }}>{u.email}</td>
                <td>{ROLE_LABELS[u.role]}</td>
                <td>{u.twoFactorEnabled ? '✓' : '—'}</td>
                <td>
                  {u.lockedUntil && new Date(u.lockedUntil) > new Date() ? (
                    <span className="tag tag-archived">Заблокирован</span>
                  ) : u.isActive ? (
                    <span className="tag tag-published">Активен</span>
                  ) : (
                    <span className="tag tag-draft">Отключён</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                      <button className="btn btn-secondary btn-sm" onClick={() => unlock.mutate(u.id)}>
                        Разблокировать
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActive.mutate({ id: u.id, isActive: !u.isActive })}
                    >
                      {u.isActive ? 'Отключить' : 'Включить'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && <InviteDialog onClose={() => setShowInvite(false)} />}
    </div>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<InviteUserRequest>({ email: '', name: '', role: 'EDITOR' });
  const [error, setError] = useState('');

  const invite = useMutation({
    mutationFn: () => api.post<User>(API.admin.users, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      onClose();
    },
    onError: (e) => setError(e instanceof ApiRequestError ? e.message : 'Ошибка'),
  });

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={dialog} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Пригласить пользователя</h2>
        <p style={{ color: 'var(--s-500)', fontSize: 13, marginTop: -8 }}>
          На указанный адрес придёт письмо со ссылкой для установки пароля.
        </p>
        <div className="field">
          <label>Имя</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>E-mail</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Роль</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="EDITOR">Редактор — управление контентом</option>
            <option value="ADMIN">Администратор — полный доступ</option>
          </select>
        </div>
        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={() => invite.mutate()} disabled={invite.isPending}>
            Отправить приглашение
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(20,24,23,.4)', display: 'grid', placeItems: 'center', zIndex: 100 };
const dialog: React.CSSProperties = { padding: 28, width: '100%', maxWidth: 440 };
