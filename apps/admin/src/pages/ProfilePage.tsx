import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  API,
  type TotpSetupResponse,
  type TotpConfirmResponse,
  type ChangePasswordRequest,
} from '@atm/contracts';
import { api, ApiRequestError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { PageHeader } from '@/components/PageHeader';

/** Профиль: смена пароля и подключение 2FA (п. X.II ТЗ). */
export function ProfilePage() {
  const user = useAuth((s) => s.user)!;
  const refreshUser = useAuth((s) => s.refreshUser);

  return (
    <div>
      <PageHeader title="Мой профиль" />
      <div style={{ display: 'grid', gap: 20, maxWidth: 560 }}>
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>{user.name}</h2>
          <p style={{ color: 'var(--s-500)', marginTop: -6 }}>{user.email}</p>
        </div>

        <ChangePassword />
        {!user.twoFactorEnabled && <SetupTotp onDone={refreshUser} />}
        {user.twoFactorEnabled && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ marginTop: 0 }}>Двухфакторная аутентификация</h3>
            <p style={{ color: 'var(--green-700)' }}>✓ Включена</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const change = useMutation({
    mutationFn: () => api.post(API.auth.changePassword, form as ChangePasswordRequest),
    onSuccess: () => {
      setMsg('Пароль изменён');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    },
    onError: (e) => {
      if (e instanceof ApiRequestError) {
        setErrors(e.fields || {});
        if (!e.fields) setMsg(e.message);
      }
    },
  });

  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={{ marginTop: 0 }}>Смена пароля</h3>
      <div className="field">
        <label>Текущий пароль</label>
        <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} autoComplete="current-password" />
        {errors.currentPassword && <div className="error">{errors.currentPassword[0]}</div>}
      </div>
      <div className="field">
        <label>Новый пароль (не менее 12 символов)</label>
        <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} autoComplete="new-password" />
        {errors.newPassword && <div className="error">{errors.newPassword[0]}</div>}
      </div>
      <div className="field">
        <label>Повторите новый пароль</label>
        <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} autoComplete="new-password" />
        {errors.confirmPassword && <div className="error">{errors.confirmPassword[0]}</div>}
      </div>
      {msg && <div style={{ color: 'var(--green-700)', fontSize: 13, marginBottom: 12 }}>{msg}</div>}
      <button className="btn btn-primary" onClick={() => change.mutate()} disabled={change.isPending}>
        Изменить пароль
      </button>
    </div>
  );
}

function SetupTotp({ onDone }: { onDone: () => Promise<void> }) {
  const [setup, setSetup] = useState<TotpSetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState('');

  const start = useMutation({
    mutationFn: () => api.post<TotpSetupResponse>(API.auth.totpSetup),
    onSuccess: setSetup,
  });
  const confirm = useMutation({
    mutationFn: () => api.post<TotpConfirmResponse>(API.auth.totpConfirm, { code }),
    onSuccess: async (res) => {
      setCodes(res.recoveryCodes);
      await onDone();
    },
    onError: (e) => setError(e instanceof ApiRequestError ? e.message : 'Ошибка'),
  });

  if (codes) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginTop: 0 }}>Двухфакторная аутентификация включена</h3>
        <p style={{ fontSize: 14 }}>
          Сохраните коды восстановления. Каждый работает один раз — они понадобятся,
          если потеряете доступ к приложению-аутентификатору.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontFamily: 'monospace', background: 'var(--s-50)', padding: 16, borderRadius: 8 }}>
          {codes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={{ marginTop: 0 }}>Двухфакторная аутентификация</h3>
      {!setup ? (
        <>
          <p style={{ fontSize: 14, color: 'var(--s-600)' }}>
            Дополнительный код при входе. Обязательна для администратора (п. X.II ТЗ).
          </p>
          <button className="btn btn-primary" onClick={() => start.mutate()} disabled={start.isPending}>
            Подключить
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 14 }}>Отсканируйте QR-код в приложении (Google Authenticator, 1Password и т.п.):</p>
          <img src={setup.qrDataUrl} alt="QR-код для настройки 2FA" style={{ width: 200, height: 200 }} />
          <p style={{ fontSize: 12, color: 'var(--s-500)' }}>
            Или введите ключ вручную: <code>{setup.secret}</code>
          </p>
          <div className="field">
            <label>Введите код из приложения для подтверждения</label>
            <input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" onClick={() => confirm.mutate()} disabled={confirm.isPending || code.length !== 6}>
            Подтвердить и включить
          </button>
        </>
      )}
    </div>
  );
}
