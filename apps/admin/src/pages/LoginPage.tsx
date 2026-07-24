import { useState } from 'react';
import { useAuth } from '@/store/auth';
import { ApiRequestError } from '@/lib/api';

/**
 * Вход в систему (пп. X.II ТЗ).
 *
 * Двухшаговый: сначала e-mail и пароль. Если у пользователя включена 2FA,
 * бэкенд отвечает totpRequired, и появляется поле кода — пароль повторно
 * не запрашивается.
 */
export function LoginPage() {
  const login = useAuth((s) => s.login);
  const loading = useAuth((s) => s.loading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [needTotp, setNeedTotp] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = await login(email, password, needTotp ? totp : undefined);
      if (result === 'totp') setNeedTotp(true);
      // при 'ok' стор проставит user и App перекинет на дашборд
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError('Не удалось выполнить вход');
    }
  }

  return (
    <div style={styles.wrap}>
      <form style={styles.card} onSubmit={onSubmit}>
        <div style={styles.brand}>
          <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
            <path d="M2 32 L13 12 L20 24 L27 8 L38 32 Z" fill="#14483C" />
            <path d="M27 8 L31.4 16 L22.6 16 Z" fill="#fff" />
            <path d="M13 12 L16.2 17.7 L9.8 17.7 Z" fill="#fff" />
            <circle cx="20" cy="35.5" r="2.2" fill="#C8912F" />
          </svg>
          <div>
            <b style={{ display: 'block' }}>Almaty Tau Management</b>
            <span style={{ color: 'var(--s-500)', fontSize: 13 }}>Управление сайтом</span>
          </div>
        </div>

        {!needTotp ? (
          <>
            <div className="field">
              <label htmlFor="email">Электронная почта</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </>
        ) : (
          <div className="field">
            <label htmlFor="totp">Код двухфакторной аутентификации</label>
            <input
              id="totp"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={totp}
              onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              required
            />
            <p style={{ fontSize: 13, color: 'var(--s-500)', marginTop: 8 }}>
              Введите код из приложения-аутентификатора
            </p>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'Проверка…' : needTotp ? 'Подтвердить' : 'Войти'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: 'var(--s-100)',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: '#fff',
    border: '1px solid var(--s-200)',
    borderRadius: 12,
    padding: 32,
  },
  brand: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28 },
  error: {
    background: '#fbecea',
    color: '#a8322a',
    padding: '10px 14px',
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 16,
  },
};
