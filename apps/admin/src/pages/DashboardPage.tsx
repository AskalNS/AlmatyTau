import { Link } from 'react-router-dom';
import { ADMIN_ROUTES } from '@atm/contracts';
import { useAuth } from '@/store/auth';
import { PageHeader } from '@/components/PageHeader';

/** Обзорный экран после входа. */
export function DashboardPage() {
  const user = useAuth((s) => s.user)!;

  const tiles = [
    { to: ADMIN_ROUTES.news, label: 'Новости', desc: 'Публикации медиацентра' },
    { to: ADMIN_ROUTES.pages, label: 'Страницы', desc: 'Разделы сайта' },
    { to: ADMIN_ROUTES.media, label: 'Медиабиблиотека', desc: 'Изображения и файлы' },
    { to: ADMIN_ROUTES.documents, label: 'Документы', desc: 'Нормативные документы' },
  ];

  return (
    <div>
      <PageHeader title={`Здравствуйте, ${user.name}`} />

      {!user.twoFactorEnabled && (
        <div style={banner}>
          <b>Рекомендуем включить двухфакторную аутентификацию.</b>{' '}
          <Link to={ADMIN_ROUTES.profile}>Настроить →</Link>
          {user.role === 'ADMIN' && ' Для администратора это требование безопасности (п. X.II ТЗ).'}
        </div>
      )}

      <div style={grid}>
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="card" style={tile}>
            <b style={{ fontSize: 16 }}>{t.label}</b>
            <span style={{ color: 'var(--s-500)', fontSize: 13 }}>{t.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const banner: React.CSSProperties = {
  background: '#fdf8ec',
  border: '1px solid #f0e0bd',
  borderRadius: 8,
  padding: '14px 18px',
  fontSize: 14,
  marginBottom: 24,
};
const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 16,
};
const tile: React.CSSProperties = {
  padding: 22,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: 'var(--s-900)',
};
