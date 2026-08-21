import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ADMIN_ROUTES } from '@atm/contracts';
import { useAuth } from './store/auth';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { RequireAuth, RequireAdmin } from './components/Guards';
import { DashboardPage } from './pages/DashboardPage';
import { NewsListPage } from './pages/news/NewsListPage';
import { NewsEditPage } from './pages/news/NewsEditPage';
import { PagesListPage } from './pages/pages/PagesListPage';
import { PageEditPage } from './pages/pages/PageEditPage';
import { PersonsListPage } from './pages/persons/PersonsListPage';
import { PersonEditPage } from './pages/persons/PersonEditPage';
import { DocumentsListPage } from './pages/documents/DocumentsListPage';
import { DocumentEditPage } from './pages/documents/DocumentEditPage';
import { VacanciesListPage } from './pages/vacancies/VacanciesListPage';
import { VacancyEditPage } from './pages/vacancies/VacancyEditPage';
import { AlbumsListPage } from './pages/albums/AlbumsListPage';
import { AlbumEditPage } from './pages/albums/AlbumEditPage';
import { MediaLibraryPage } from './pages/media/MediaLibraryPage';
import { LinksListPage } from './pages/links/LinksListPage';
import { LinkEditPage } from './pages/links/LinkEditPage';
import { MenuListPage } from './pages/menu/MenuListPage';
import { MenuEditPage } from './pages/menu/MenuEditPage';
import { SettingsPage } from './pages/SettingsPage';
import { HomeSectionsPage } from './pages/HomeSectionsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditPage } from './pages/AuditPage';
import { ProfilePage } from './pages/ProfilePage';

/**
 * Маршрутизация админки.
 *
 * Разделы «Пользователи», «Журнал», «Настройки» обёрнуты RequireAdmin —
 * это дублирует серверную проверку ролей для удобства, но решение о доступе
 * всё равно принимает бэкенд (п. V ТЗ).
 */
export function App() {
  const { initializing, user, init } = useAuth();
  const location = useLocation();

  useEffect(() => {
    void init();
  }, [init]);

  if (initializing) {
    return <div style={{ padding: 40, color: 'var(--s-500)' }}>Загрузка…</div>;
  }

  // 2FA обязательна для ADMIN (п. X.II ТЗ) — бэкенд и так блокирует всё,
  // кроме её настройки (JwtAuthGuard), пока она выключена. Здесь — только
  // чтобы не показывать россыпь 403 при переходе куда угодно ещё.
  if (user?.role === 'ADMIN' && !user.twoFactorEnabled && location.pathname !== ADMIN_ROUTES.profile) {
    return <Navigate to={ADMIN_ROUTES.profile} replace />;
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

        {/* Контент — обе роли (п. V ТЗ) */}
        <Route path={ADMIN_ROUTES.news} element={<NewsListPage />} />
        <Route path={ADMIN_ROUTES.newsNew} element={<NewsEditPage />} />
        <Route path="/news/:id" element={<NewsEditPage />} />

        <Route path={ADMIN_ROUTES.pages} element={<PagesListPage />} />
        <Route path="/pages/:id" element={<PageEditPage />} />

        <Route path={ADMIN_ROUTES.persons} element={<PersonsListPage />} />
        <Route path={ADMIN_ROUTES.personNew} element={<PersonEditPage />} />
        <Route path="/persons/:id" element={<PersonEditPage />} />

        <Route path={ADMIN_ROUTES.documents} element={<DocumentsListPage />} />
        <Route path="/documents/:id" element={<DocumentEditPage />} />

        <Route path={ADMIN_ROUTES.vacancies} element={<VacanciesListPage />} />
        <Route path={ADMIN_ROUTES.vacancyNew} element={<VacancyEditPage />} />
        <Route path="/vacancies/:id" element={<VacancyEditPage />} />

        <Route path={ADMIN_ROUTES.albums} element={<AlbumsListPage />} />
        <Route path={ADMIN_ROUTES.albumNew} element={<AlbumEditPage />} />
        <Route path="/albums/:id" element={<AlbumEditPage />} />

        <Route path={ADMIN_ROUTES.media} element={<MediaLibraryPage />} />

        <Route path={ADMIN_ROUTES.links} element={<LinksListPage />} />
        <Route path={ADMIN_ROUTES.linkNew} element={<LinkEditPage />} />
        <Route path="/links/:id" element={<LinkEditPage />} />

        <Route path={ADMIN_ROUTES.menu} element={<MenuListPage />} />
        <Route path={ADMIN_ROUTES.menuNew} element={<MenuEditPage />} />
        <Route path="/menu/:id" element={<MenuEditPage />} />

        <Route path={ADMIN_ROUTES.home} element={<HomeSectionsPage />} />
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
              <SettingsPage />
            </RequireAdmin>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
