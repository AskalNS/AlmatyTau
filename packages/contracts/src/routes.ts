import type { Locale } from './common.js';

/* ============================================================================
   Маршруты.

   Собраны в одном месте, чтобы адрес страницы существовал в проекте
   ровно один раз. Иначе ссылки расползаются строками по компонентам,
   и переименование раздела превращается в поиск по всему коду.
   ========================================================================== */

/* ------------------------------------------------------------- API-эндпоинты */

export const API = {
  health: '/api/health',

  auth: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    changePassword: '/api/auth/password',
    totpSetup: '/api/auth/totp/setup',
    totpConfirm: '/api/auth/totp/confirm',
    totpDisable: '/api/auth/totp',
    acceptInvite: '/api/auth/invite/accept',
  },

  /** Публичное API. Отдаёт только опубликованное и только на одном языке. */
  public: {
    layout: '/api/public/layout',
    home: '/api/public/home',
    page: (path: string) => `/api/public/pages/${path}`,
    news: '/api/public/news',
    newsItem: (slug: string) => `/api/public/news/${slug}`,
    persons: '/api/public/persons',
    person: (slug: string) => `/api/public/persons/${slug}`,
    documents: '/api/public/documents',
    documentCategories: '/api/public/documents/categories',
    documentDownload: (id: string) => `/api/public/documents/${id}/download`,
    vacancies: '/api/public/vacancies',
    vacancy: (slug: string) => `/api/public/vacancies/${slug}`,
    albums: '/api/public/albums',
    album: (slug: string) => `/api/public/albums/${slug}`,
    links: '/api/public/links',
    search: '/api/public/search',
    feedback: '/api/public/feedback',
    sitemap: '/api/public/sitemap',
  },

  /** Админское API. Требует авторизации, часть — роли Администратор. */
  admin: {
    users: '/api/admin/users',
    user: (id: string) => `/api/admin/users/${id}`,
    audit: '/api/admin/audit',
    settings: '/api/admin/settings',

    menu: '/api/admin/menu',
    menuItem: (id: string) => `/api/admin/menu/${id}`,
    menuReorder: '/api/admin/menu/reorder',

    pages: '/api/admin/pages',
    page: (id: string) => `/api/admin/pages/${id}`,

    news: '/api/admin/news',
    newsItem: (id: string) => `/api/admin/news/${id}`,

    persons: '/api/admin/persons',
    person: (id: string) => `/api/admin/persons/${id}`,

    documents: '/api/admin/documents',
    document: (id: string) => `/api/admin/documents/${id}`,
    documentCategories: '/api/admin/documents/categories',

    vacancies: '/api/admin/vacancies',
    vacancy: (id: string) => `/api/admin/vacancies/${id}`,

    links: '/api/admin/links',
    link: (id: string) => `/api/admin/links/${id}`,

    media: '/api/admin/media',
    mediaItem: (id: string) => `/api/admin/media/${id}`,
    mediaUpload: '/api/admin/media/upload',

    albums: '/api/admin/albums',
    album: (id: string) => `/api/admin/albums/${id}`,

    home: '/api/admin/home',

    /** Ссылка предпросмотра черновика: открывает страницу сайта. */
    preview: '/api/admin/preview',
  },
} as const;

/* ------------------------------------------------------- маршруты сайта */

/**
 * Пути публичного сайта без языкового префикса.
 *
 * Соответствуют разделам ТЗ. Страницы-хабы (company, corporate, media)
 * добавлены потому, что п. IV требует уникальный URL для каждого пункта
 * меню, а родительский пункт с выпадающим списком своей страницы не имеет —
 * он недоступен с клавиатуры и теряет уровень вложенности в SEO.
 */
export const ROUTES = {
  home: '',

  company: 'company',
  about: 'company/about',
  board: 'company/board',
  boardPerson: (slug: string) => `company/board/${slug}`,
  supervisory: 'company/supervisory-board',
  supervisoryPerson: (slug: string) => `company/supervisory-board/${slug}`,
  structure: 'company/structure',

  project: 'project',

  corporate: 'corporate',
  documents: 'corporate/documents',
  procurement: 'corporate/procurement',
  vacancies: 'corporate/vacancies',
  vacancy: (slug: string) => `corporate/vacancies/${slug}`,

  media: 'media',
  news: 'media/news',
  newsItem: (slug: string) => `media/news/${slug}`,
  gallery: 'media/gallery',
  album: (slug: string) => `media/gallery/${slug}`,

  contacts: 'contacts',
  search: 'search',
  privacy: 'privacy',
  sitemap: 'sitemap',
} as const;

/** Полный путь с языковым префиксом: href('ru', ROUTES.news) → '/ru/media/news' */
export function href(locale: Locale, path: string): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}

/* ------------------------------------------------------ маршруты админки */

export const ADMIN_ROUTES = {
  login: '/login',
  dashboard: '/',

  news: '/news',
  newsNew: '/news/new',
  newsEdit: (id: string) => `/news/${id}`,

  pages: '/pages',
  pageEdit: (id: string) => `/pages/${id}`,

  home: '/home',

  persons: '/persons',
  personNew: '/persons/new',
  personEdit: (id: string) => `/persons/${id}`,

  documents: '/documents',
  documentCategories: '/documents/categories',

  vacancies: '/vacancies',
  vacancyNew: '/vacancies/new',
  vacancyEdit: (id: string) => `/vacancies/${id}`,

  albums: '/albums',
  albumNew: '/albums/new',
  albumEdit: (id: string) => `/albums/${id}`,

  media: '/media',
  links: '/links',
  menu: '/menu',
  settings: '/settings',

  /** Только для роли Администратор (п. V ТЗ). */
  users: '/users',
  audit: '/audit',
  profile: '/profile',
} as const;

/** Разделы админки, закрытые для роли Редактор. */
export const ADMIN_ONLY_ROUTES: string[] = [
  ADMIN_ROUTES.users,
  ADMIN_ROUTES.audit,
  ADMIN_ROUTES.settings,
];
