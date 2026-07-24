import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ADMIN_ROUTES } from '@atm/contracts';
import { useAuth } from './store/auth';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { RequireAuth, RequireAdmin } from './components/Guards';
import { DashboardPage } from './pages/DashboardPage';
import { NewsListPage } from './pages/news/NewsListPage';
import { NewsEditPage } from './pages/news/NewsEditPage';
import { UsersPage } from './pages/UsersPage';
import { AuditPage } from './pages/AuditPage';
import { ProfilePage } from './pages/ProfilePage';
import { PlaceholderPage } from './pages/PlaceholderPage';

/**
 * Маршрутизация админки.
 *
 * Разделы «Пользователи», «Журнал», «Настройки» обёрнуты RequireAdmin —
 * это дублирует серверную проверку ролей для удобства, но решение о доступе
 * всё равно принимает бэкенд (п. V ТЗ).
 */
export function App() {
  const { initializing, user, init } = useAuth();

  useEffect(() => {
    void init();
  }, [init]);

  if (initializing) {
    return <div style={{ padding: 40, color: 'var(--s-500)' }}>Загрузка…</div>;
  }

  return (
    <Routes>
      <Route path={ADMIN_ROUTES.login} element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path={ADMIN_ROUTES.dashboard} element={<DashboardPage />} />

        {/* Контент — обе роли */}
        <Route path={ADMIN_ROUTES.news} element={<NewsListPage />} />
        <Route path={ADMIN_ROUTES.newsNew} element={<NewsEditPage />} />
        <Route path="/news/:id" element={<NewsEditPage />} />

        <Route path={ADMIN_ROUTES.pages} element={<PlaceholderPage title="Страницы" />} />
        <Route path={ADMIN_ROUTES.persons} element={<PlaceholderPage title="Персоны" />} />
        <Route path={ADMIN_ROUTES.documents} element={<PlaceholderPage title="Документы" />} />
        <Route path={ADMIN_ROUTES.vacancies} element={<PlaceholderPage title="Вакансии" />} />
        <Route path={ADMIN_ROUTES.albums} element={<PlaceholderPage title="Медиагалерея" />} />
        <Route path={ADMIN_ROUTES.media} element={<PlaceholderPage title="Медиабиблиотека" />} />
        <Route path={ADMIN_ROUTES.links} element={<PlaceholderPage title="Ссылки" />} />
        <Route path={ADMIN_ROUTES.menu} element={<PlaceholderPage title="Меню" />} />
        <Route path={ADMIN_ROUTES.home} element={<PlaceholderPage title="Главная страница" />} />
        <Route path={ADMIN_ROUTES.profile} element={<ProfilePage />} />

        {/* Только администратор */}
        <Route
          path={ADMIN_ROUTES.users}
          element={
            <RequireAdmin>
              <UsersPage />
            </RequireAdmin>
          }
        />
        <Route
          path={ADMIN_ROUTES.audit}
          element={
            <RequireAdmin>
              <AuditPage />
            </RequireAdmin>
          }
        />
        <Route
          path={ADMIN_ROUTES.settings}
          element={
            <RequireAdmin>
              <PlaceholderPage title="Настройки сайта" />
            </RequireAdmin>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
