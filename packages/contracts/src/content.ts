import { z } from 'zod';
import {
  localeSchema,
  slugSchema,
  isoDateSchema,
  publishStatusSchema,
  seoSchema,
} from './common.js';
import { blocksSchema } from './blocks.js';

/* ============================================================================
   Контентные сущности.

   Общий приём: сама сущность хранит нейтральные к языку поля (slug, дата,
   обложка, статус), а тексты вынесены в translations по одной записи
   на язык. Это и есть «отдельная структура контента и независимое
   редактирование» из п. III ТЗ.
   ========================================================================== */

/** Перевод, общий по форме для всех текстовых сущностей. */
const translationBase = {
  locale: localeSchema,
  title: z.string().trim().min(1, 'Укажите заголовок').max(500),
  seo: seoSchema.partial().optional(),
};

/* ============================================================================
   Страницы (разделы 2.1, 2.4, 3, 4.2, политика конфиденциальности)
   ========================================================================== */

export const pageTranslationSchema = z.object({
  ...translationBase,
  /** Вводный абзац под заголовком. */
  lead: z.string().trim().max(2000).optional().nullable(),
  blocks: blocksSchema.default([]),
});
export type PageTranslation = z.infer<typeof pageTranslationSchema>;

export const pageSchema = z.object({
  id: z.string(),
  /** Полный путь без языкового префикса: company/about, project, corporate. */
  path: z.string().min(1).max(300),
  parentId: z.string().nullable(),
  coverId: z.string().nullable(),
  status: publishStatusSchema,
  /**
   * Системные страницы (контакты, поиск, 404) удалять нельзя —
   * на них завязана навигация. Редактировать содержимое можно.
   */
  isSystem: z.boolean(),
  order: z.number().int(),
  translations: z.array(pageTranslationSchema),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Page = z.infer<typeof pageSchema>;

export const upsertPageRequestSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .regex(/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/, 'Путь может содержать латиницу, цифры, дефис и слеш'),
  parentId: z.string().optional().nullable(),
  coverId: z.string().optional().nullable(),
  status: publishStatusSchema.default('DRAFT'),
  order: z.number().int().default(0),
  translations: z.array(pageTranslationSchema).min(1, 'Заполните хотя бы один язык'),
});
export type UpsertPageRequest = z.infer<typeof upsertPageRequestSchema>;

/* ============================================================================
   Новости (п. 5.1 ТЗ)
   ========================================================================== */

export const newsTranslationSchema = z.object({
  ...translationBase,
  /** Анонс для карточки в ленте. */
  excerpt: z.string().trim().max(1000).optional().nullable(),
  blocks: blocksSchema.default([]),
});
export type NewsTranslation = z.infer<typeof newsTranslationSchema>;

export const newsSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  coverId: z.string().nullable(),
  status: publishStatusSchema,
  publishedAt: isoDateSchema.nullable(),
  /** Закрепить в начале ленты. */
  isPinned: z.boolean(),
  categoryId: z.string().nullable(),
  translations: z.array(newsTranslationSchema),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type News = z.infer<typeof newsSchema>;

export const upsertNewsRequestSchema = z.object({
  slug: slugSchema,
  coverId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  status: publishStatusSchema.default('DRAFT'),
  publishedAt: z.string().optional().nullable(),
  isPinned: z.boolean().default(false),
  translations: z.array(newsTranslationSchema).min(1, 'Заполните хотя бы один язык'),
});
export type UpsertNewsRequest = z.infer<typeof upsertNewsRequestSchema>;

export const newsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(9),
  /** Год для архива — п. 5.1 требует архив и сортировку по дате. */
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  categoryId: z.string().optional(),
  search: z.string().trim().max(200).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export type NewsQuery = z.infer<typeof newsQuerySchema>;

/* ============================================================================
   Персоны: Правление и Наблюдательный совет (пп. 2.2, 2.3 ТЗ)
   ========================================================================== */

export const PERSON_BOARDS = ['MANAGEMENT', 'SUPERVISORY'] as const;
export const personBoardSchema = z.enum(PERSON_BOARDS);
export type PersonBoard = z.infer<typeof personBoardSchema>;

export const PERSON_BOARD_LABELS: Record<PersonBoard, string> = {
  MANAGEMENT: 'Правление',
  SUPERVISORY: 'Наблюдательный совет',
};

export const personTranslationSchema = z.object({
  locale: localeSchema,
  /** ФИО переводится: казахское и русское написание различаются. */
  fullName: z.string().trim().min(2, 'Укажите ФИО').max(300),
  position: z.string().trim().min(1, 'Укажите должность').max(300),
  bio: z.string().trim().max(20_000).optional().nullable(),
});
export type PersonTranslation = z.infer<typeof personTranslationSchema>;

export const personSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  board: personBoardSchema,
  photoId: z.string().nullable(),
  order: z.number().int(),
  status: publishStatusSchema,
  translations: z.array(personTranslationSchema),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Person = z.infer<typeof personSchema>;

export const upsertPersonRequestSchema = z.object({
  slug: slugSchema,
  board: personBoardSchema,
  photoId: z.string().optional().nullable(),
  order: z.number().int().default(0),
  status: publishStatusSchema.default('DRAFT'),
  translations: z.array(personTranslationSchema).min(1, 'Заполните хотя бы один язык'),
});
export type UpsertPersonRequest = z.infer<typeof upsertPersonRequestSchema>;

/* ============================================================================
   Документы (п. 4.1 ТЗ)
   ========================================================================== */

export const documentCategoryTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().trim().min(1).max(300),
});

export const documentCategorySchema = z.object({
  id: z.string(),
  slug: slugSchema,
  order: z.number().int(),
  translations: z.array(documentCategoryTranslationSchema),
});
export type DocumentCategory = z.infer<typeof documentCategorySchema>;

export const documentTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().trim().min(1, 'Укажите название').max(500),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const documentSchema = z.object({
  id: z.string(),
  categoryId: z.string().nullable(),
  /** Ссылка на файл в хранилище. */
  fileId: z.string(),
  fileName: z.string(),
  fileSize: z.number().int(),
  fileMime: z.string(),
  /** Дата редакции документа, а не дата загрузки. */
  documentDate: isoDateSchema.nullable(),
  /**
   * Номер редакции. Замена файла увеличивает его, но id документа
   * и публичный URL сохраняются — иначе ссылки из писем и других
   * документов Заказчика превратятся в битые.
   */
  revision: z.number().int(),
  status: publishStatusSchema,
  order: z.number().int(),
  translations: z.array(documentTranslationSchema),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Document = z.infer<typeof documentSchema>;

export const upsertDocumentRequestSchema = z.object({
  categoryId: z.string().optional().nullable(),
  fileId: z.string().min(1, 'Загрузите файл'),
  documentDate: z.string().optional().nullable(),
  status: publishStatusSchema.default('PUBLISHED'),
  order: z.number().int().default(0),
  translations: z.array(documentTranslationSchema).min(1, 'Заполните хотя бы один язык'),
});
export type UpsertDocumentRequest = z.infer<typeof upsertDocumentRequestSchema>;

export const documentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().optional(),
  search: z.string().trim().max(200).optional(),
});
export type DocumentQuery = z.infer<typeof documentQuerySchema>;

/* ============================================================================
   Вакансии (п. 4.3 ТЗ)
   ========================================================================== */

export const vacancyTranslationSchema = z.object({
  ...translationBase,
  department: z.string().trim().max(300).optional().nullable(),
  requirements: z.string().trim().max(20_000).optional().nullable(),
  conditions: z.string().trim().max(20_000).optional().nullable(),
  responsibilities: z.string().trim().max(20_000).optional().nullable(),
});
export type VacancyTranslation = z.infer<typeof vacancyTranslationSchema>;

export const vacancySchema = z.object({
  id: z.string(),
  slug: slugSchema,
  status: publishStatusSchema,
  publishedAt: isoDateSchema.nullable(),
  /** Срок приёма документов. После него вакансия уходит из списка сама. */
  deadline: isoDateSchema.nullable(),
  contactEmail: z.string().nullable(),
  translations: z.array(vacancyTranslationSchema),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Vacancy = z.infer<typeof vacancySchema>;

export const upsertVacancyRequestSchema = z.object({
  slug: slugSchema,
  status: publishStatusSchema.default('DRAFT'),
  publishedAt: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal('')),
  translations: z.array(vacancyTranslationSchema).min(1, 'Заполните хотя бы один язык'),
});
export type UpsertVacancyRequest = z.infer<typeof upsertVacancyRequestSchema>;

/* ============================================================================
   Ссылки на внешние ресурсы (п. VI ТЗ)
   ========================================================================== */

export const LINK_GROUPS = ['GOVERNMENT', 'PARTNERS', 'PROCUREMENT', 'OTHER'] as const;
export const linkGroupSchema = z.enum(LINK_GROUPS);
export type LinkGroup = z.infer<typeof linkGroupSchema>;

export const LINK_GROUP_LABELS: Record<LinkGroup, string> = {
  GOVERNMENT: 'Государственные органы',
  PARTNERS: 'Партнёры',
  PROCUREMENT: 'Государственные закупки',
  OTHER: 'Прочие ресурсы',
};

export const linkTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().trim().min(1, 'Укажите название').max(300),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const linkSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  group: linkGroupSchema,
  logoId: z.string().nullable(),
  order: z.number().int(),
  isActive: z.boolean(),
  translations: z.array(linkTranslationSchema),
});
export type Link = z.infer<typeof linkSchema>;

export const upsertLinkRequestSchema = z.object({
  url: z.string().url('Укажите корректный адрес'),
  group: linkGroupSchema,
  logoId: z.string().optional().nullable(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  translations: z.array(linkTranslationSchema).min(1, 'Заполните хотя бы один язык'),
});
export type UpsertLinkRequest = z.infer<typeof upsertLinkRequestSchema>;

/* ============================================================================
   Меню (п. IV ТЗ)

   Хранится в БД деревом, а не в коде: ТЗ разрешает Заказчику менять
   структуру и наименования разделов на любом этапе, и это не должно
   быть релизом.
   ========================================================================== */

export const menuItemTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().trim().min(1, 'Укажите название пункта').max(200),
});

export const menuItemSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  /** Внутренний путь без языкового префикса либо внешний URL. */
  href: z.string().min(1).max(1000),
  isExternal: z.boolean(),
  order: z.number().int(),
  /**
   * Видимость отдельно по каждому языку: раздел может быть готов
   * на русском и ещё не переведён на английский.
   */
  visibleLocales: z.array(localeSchema),
  /** MAIN — главное меню, FOOTER — подвал. */
  location: z.enum(['MAIN', 'FOOTER']),
  translations: z.array(menuItemTranslationSchema),
});
export type MenuItem = z.infer<typeof menuItemSchema>;

/** Пункт меню в публичном API — сведён к одному языку и вложен деревом. */
export interface PublicMenuItem {
  id: string;
  title: string;
  href: string;
  isExternal: boolean;
  children: PublicMenuItem[];
}

export const upsertMenuItemRequestSchema = z.object({
  parentId: z.string().optional().nullable(),
  href: z.string().trim().min(1).max(1000),
  isExternal: z.boolean().default(false),
  order: z.number().int().default(0),
  visibleLocales: z.array(localeSchema).min(1, 'Выберите хотя бы один язык'),
  location: z.enum(['MAIN', 'FOOTER']).default('MAIN'),
  translations: z.array(menuItemTranslationSchema).min(1),
});
export type UpsertMenuItemRequest = z.infer<typeof upsertMenuItemRequestSchema>;

/** Перестановка пунктов после drag-and-drop. */
export const reorderMenuRequestSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      parentId: z.string().nullable(),
      order: z.number().int(),
    }),
  ),
});
export type ReorderMenuRequest = z.infer<typeof reorderMenuRequestSchema>;

/* ============================================================================
   Настройки сайта: контакты, подвал, реквизиты (п. 6 ТЗ)
   ========================================================================== */

export const settingsTranslationSchema = z.object({
  locale: localeSchema,
  organizationName: z.string().trim().min(1).max(300),
  address: z.string().trim().max(500),
  workingHours: z.string().trim().max(300),
  footerText: z.string().trim().max(2000).optional().nullable(),
});

export const settingsSchema = z.object({
  phones: z.array(z.string().trim().max(50)).max(10),
  emails: z.array(z.string().email()).max(10),
  /** Координаты для карты на странице контактов. */
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  socials: z
    .array(z.object({ kind: z.string().max(40), url: z.string().url() }))
    .max(20),
  /** Показывать ли форму обратной связи — в п. 6 ТЗ она «при необходимости». */
  feedbackEnabled: z.boolean(),
  /** Число новостей в ленте на главной: п. 1 ТЗ требует 3–5. */
  homeNewsCount: z.number().int().min(3).max(5),
  translations: z.array(settingsTranslationSchema),
});
export type Settings = z.infer<typeof settingsSchema>;

export const updateSettingsRequestSchema = settingsSchema.partial().extend({
  translations: z.array(settingsTranslationSchema).optional(),
});
export type UpdateSettingsRequest = z.infer<typeof updateSettingsRequestSchema>;

/* ============================================================================
   Форма обратной связи (п. 6 ТЗ)
   ========================================================================== */

export const feedbackRequestSchema = z.object({
  name: z.string().trim().min(2, 'Укажите имя').max(200),
  email: z.string().trim().toLowerCase().email('Некорректный адрес электронной почты'),
  phone: z.string().trim().max(50).optional().nullable(),
  subject: z.string().trim().max(300).optional().nullable(),
  message: z.string().trim().min(10, 'Сообщение слишком короткое').max(5000),
  /**
   * Согласие на обработку персональных данных.
   * Обязательно по Закону РК «О персональных данных и их защите» (п. I ТЗ).
   */
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Необходимо согласие на обработку персональных данных' }),
  }),
  /**
   * Приманка для ботов: поле скрыто стилями, человек его не заполнит.
   * Дешевле и доступнее капчи, которая мешает пользователям скринридеров.
   */
  website: z.string().max(0).optional(),
});
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;

/* ============================================================================
   Поиск по сайту (п. VI ТЗ)
   ========================================================================== */

export const SEARCH_TYPES = ['news', 'page', 'document', 'vacancy', 'person'] as const;
export const searchTypeSchema = z.enum(SEARCH_TYPES);
export type SearchType = z.infer<typeof searchTypeSchema>;

export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  news: 'Новости',
  page: 'Страницы',
  document: 'Документы',
  vacancy: 'Вакансии',
  person: 'Персоны',
};

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Введите не менее двух символов').max(200),
  type: searchTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const searchResultSchema = z.object({
  type: searchTypeSchema,
  id: z.string(),
  title: z.string(),
  /** Фрагмент текста с подсветкой совпадения. */
  snippet: z.string(),
  href: z.string(),
  date: isoDateSchema.nullable(),
});
export type SearchResult = z.infer<typeof searchResultSchema>;
