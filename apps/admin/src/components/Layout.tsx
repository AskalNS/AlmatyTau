import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ADMIN_ROUTES, ROLE_LABELS } from '@atm/contracts';
import { useAuth } from '@/store/auth';
import styles from './layout.module.css';

/** Пункты навигации. adminOnly скрываются от роли Редактор (п. V ТЗ). */
const NAV: Array<{ to: string; label: string; adminOnly?: boolean; group?: string }> = [
  { to: ADMIN_ROUTES.dashboard, label: 'Обзор' },
  { to: ADMIN_ROUTES.home, label: 'Главная страница', group: 'Контент' },
  { to: ADMIN_ROUTES.pages, label: 'Страницы' },
  { to: ADMIN_ROUTES.news, label: 'Новости' },
  { to: ADMIN_ROUTES.persons, label: 'Персоны' },
  { to: ADMIN_ROUTES.documents, label: 'Документы' },
  { to: ADMIN_ROUTES.vacancies, label: 'Вакансии' },
  { to: ADMIN_ROUTES.albums, label: 'Медиагалерея' },
  { to: ADMIN_ROUTES.media, label: 'Медиабиблиотека' },
  { to: ADMIN_ROUTES.links, label: 'Ссылки' },
  { to: ADMIN_ROUTES.menu, label: 'Меню' },
  { to: ADMIN_ROUTES.users, label: 'Пользователи', adminOnly: true, group: 'Система' },
  { to: ADMIN_ROUTES.audit, label: 'Журнал действий', adminOnly: true },
  { to: ADMIN_ROUTES.settings, label: 'Настройки', adminOnly: true },
];

export function Layout() {
  const user = useAuth((s) => s.user)!;
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  const items = NAV.filter((i) => !i.adminOnly || user.role === 'ADMIN');

  async function onLogout() {
    await logout();
    navigate(ADMIN_ROUTES.login);
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>ATM · Админка</div>
        <nav className={styles.nav}>
          {items.map((item) => (
            <div key={item.to}>
              {item.group && <div className={styles.group}>{item.group}</div>}
              <NavLink
                to={item.to}
                end={item.to === ADMIN_ROUTES.dashboard}
                className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
              >
                {item.label}
              </NavLink>
            </div>
          ))}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.spacer} />
          {user.mustChangePassword && (
            <NavLink to={ADMIN_ROUTES.profile} className={styles.warn}>
              Смените временный пароль →
            </NavLink>
          )}
          <NavLink to={ADMIN_ROUTES.profile} className={styles.user}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userRole}>{ROLE_LABELS[user.role]}</span>
          </NavLink>
          <button className="btn btn-secondary btn-sm" onClick={onLogout}>
            Выйти
          </button>
        </header>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
