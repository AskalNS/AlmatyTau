import { Navigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { ADMIN_ROUTES } from '@atm/contracts';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to={ADMIN_ROUTES.login} replace />;
  return <>{children}</>;
}

/**
 * Гвард раздела администратора. Это удобство интерфейса — реальную защиту
 * обеспечивает бэкенд (@Roles('ADMIN')), редактор получит 403 при прямом
 * запросе к API даже в обход этого экрана (п. V ТЗ).
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  if (user?.role !== 'ADMIN') {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <h2>Недостаточно прав</h2>
        <p style={{ color: 'var(--s-500)' }}>Этот раздел доступен только администратору.</p>
      </div>
    );
  }
  return <>{children}</>;
}
