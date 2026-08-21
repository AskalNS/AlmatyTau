import { z } from 'zod';
import { localeSchema, isoDateSchema, slugSchema } from './common.js';
import { blocksSchema } from './blocks.js';
import { mediaSchema } from './media.js';
import { personBoardSchema, linkGroupSchema } from './content.js';

/* ============================================================================
   Публичное API.

   Отличается от админского принципиально: сущность уже сведена к одному
   языку, черновики и неопубликованное сюда не попадают, служебные поля
   (внутренние идентификаторы, статусы, автор) не отдаются.

   Правило, определяющее всю выдачу: если для запрошенного языка перевода
   нет, сущность не возвращается вовсе и НЕ подменяется другим языком.
   Требование п. III ТЗ о независимом редактировании языковых версий.
   ========================================================================== */

/** Присутствует у каждой публичной сущности: нужно для переключателя языков. */
export const availableLocalesField = z.array(localeSchema);

export const publicSeoSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  ogImage: z.string().nullable(),
  noindex: z.boolean(),
  /** Языки, на которых страница существует — для тегов hreflang. */
  availableLocales: availableLocalesField,
});
export type PublicSeo = z.infer<typeof publicSeoSchema>;

/* --------------------------------------------------------------- документы */

export const publicDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  /** Ссылка на скачивание. Стабильна между редакциями файла. */
  url: z.string(),
  fileName: z.string(),
  fileSize: z.number().int(),
  fileMime: z.string(),
  documentDate: isoDateSchema.nullable(),
  revision: z.number().int(),
  category: z.object({ id: z.string(), slug: slugSchema, title: z.string() }).nullable(),
});
export type PublicDocument = z.infer<typeof publicDocumentSchema>;

/**
 * Документы, на которые ссылается блок `file`, — словарь по id.
 *
 * Тот же приём, что и с blockMediaMapSchema: блок хранит только
 * идентификаторы, а название/ссылку на скачивание страница прикладывает
 * целиком. Без словаря блок `file` не может показать название документа.
 */
export const blockDocumentMapSchema = z.record(z.string(), publicDocumentSchema);
export type BlockDocumentMap = z.infer<typeof blockDocumentMapSchema>;

/* ------------------------------------------------------------------ новости */

export const publicNewsCardSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  title: z.string(),
  excerpt: z.string().nullable(),
  cover: mediaSchema.nullable(),
  publishedAt: isoDateSchema.nullable(),
  isPinned: z.boolean(),
});
export type PublicNewsCard = z.infer<typeof publicNewsCardSchema>;

export const publicNewsSchema = publicNewsCardSchema.extend({
  blocks: blocksSchema,
  media: z.record(z.string(), mediaSchema),
  documents: blockDocumentMapSchema,
  seo: publicSeoSchema,
  related: z.array(publicNewsCardSchema),
});
export type PublicNews = z.infer<typeof publicNewsSchema>;

/* ----------------------------------------------------------------- страницы */

/**
 * Медиафайлы, на которые ссылаются блоки, — словарь по id.
 *
 * Блок хранит только идентификатор. Без этого словаря сайту пришлось бы
 * запрашивать каждый файл отдельно, а до тех пор изображение в блоке
 * не рисуется вовсе.
 */
export const blockMediaMapSchema = z.record(z.string(), mediaSchema);
export type BlockMediaMap = z.infer<typeof blockMediaMapSchema>;

export const publicPageSchema = z.object({
  id: z.string(),
  path: z.string(),
  title: z.string(),
  lead: z.string().nullable(),
  cover: mediaSchema.nullable(),
  blocks: blocksSchema,
  media: blockMediaMapSchema,
  documents: blockDocumentMapSchema,
  seo: publicSeoSchema,
  updatedAt: isoDateSchema,
});
export type PublicPage = z.infer<typeof publicPageSchema>;

/* ----------------------------------------------------------------- персоны */

export const publicPersonSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  board: personBoardSchema,
  fullName: z.string(),
  position: z.string(),
  bio: z.string().nullable(),
  photo: mediaSchema.nullable(),
});
export type PublicPerson = z.infer<typeof publicPersonSchema>;

/* ---------------------------------------------------------------- вакансии */

export const publicVacancySchema = z.object({
  id: z.string(),
  slug: slugSchema,
  title: z.string(),
  department: z.string().nullable(),
  requirements: z.string().nullable(),
  conditions: z.string().nullable(),
  responsibilities: z.string().nullable(),
  deadline: isoDateSchema.nullable(),
  contactEmail: z.string().nullable(),
  publishedAt: isoDateSchema.nullable(),
});
export type PublicVacancy = z.infer<typeof publicVacancySchema>;

/* ------------------------------------------------------------ медиагалерея */

/**
 * Карточка альбома в списке галереи.
 *
 * Полный альбом описан в media.ts (publicAlbumSchema) — там же, где медиа.
 * Здесь только то, что нужно списку: обложка и число файлов в подписи.
 */
export const publicAlbumCardSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  title: z.string(),
  description: z.string().nullable(),
  cover: mediaSchema.nullable(),
  publishedAt: isoDateSchema.nullable(),
  count: z.number().int(),
});
export type PublicAlbumCard = z.infer<typeof publicAlbumCardSchema>;

/* ------------------------------------------------------------------ ссылки */

export const publicLinkSchema = z.object({
  id: z.string(),
  url: z.string(),
  group: linkGroupSchema,
  title: z.string(),
  description: z.string().nullable(),
  logo: mediaSchema.nullable(),
});
export type PublicLink = z.infer<typeof publicLinkSchema>;

/* -------------------------------------------------------------- настройки */

export const publicSettingsSchema = z.object({
  organizationName: z.string(),
  address: z.string(),
  workingHours: z.string(),
  footerText: z.string().nullable(),
  phones: z.array(z.string()),
  emails: z.array(z.string()),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  socials: z.array(z.object({ kind: z.string(), url: z.string() })),
  feedbackEnabled: z.boolean(),
});
export type PublicSettings = z.infer<typeof publicSettingsSchema>;

/* ============================================================================
   Главная страница (п. 1 ТЗ)

   Состав и порядок секций редактируются из админки — п. IV ТЗ разрешает
   Заказчику менять структуру на любом этапе.
   ========================================================================== */

export const HOME_SECTION_TYPES = [
  'hero',
  'about',
  'stats',
  'map',
  'news',
  'directions',
  'partners',
] as const;
export const homeSectionTypeSchema = z.enum(HOME_SECTION_TYPES);
export type HomeSectionType = z.infer<typeof homeSectionTypeSchema>;

export const HOME_SECTION_LABELS: Record<HomeSectionType, string> = {
  hero: 'Главный экран',
  about: 'О проекте',
  stats: 'Ключевые цифры',
  map: 'Карта территории',
  news: 'Лента новостей',
  directions: 'Направления развития',
  partners: 'Партнёры и госресурсы',
};

/**
 * Главный экран.
 *
 * Постер обязателен, видео — нет. Это следствие п. VIII ТЗ: LCP-элементом
 * должно быть изображение, иначе целевые 80 баллов PageSpeed на мобильных
 * недостижимы. Видео подключается после события load и только на desktop.
 */
export const publicHeroSchema = z.object({
  eyebrow: z.string().nullable(),
  title: z.string(),
  subtitle: z.string().nullable(),
  poster: mediaSchema.nullable(),
  video: mediaSchema.nullable(),
  /**
   * Кадры анимированного баннера.
   *
   * П. 1 ТЗ требует в верхней части главной динамический визуальный блок —
   * видео **или** анимированный баннер. Кадры берутся из блока «Галерея»
   * внутри секции «Главный экран»: так Заказчик меняет баннер из админки
   * теми же средствами, что и остальной контент, без отдельной сущности.
   * Первый кадр совпадает с постером и остаётся LCP-элементом.
   */
  frames: z.array(mediaSchema).default([]),
  /** Отдавать ли видео на мобильных. По умолчанию нет. */
  videoOnMobile: z.boolean(),
  primaryLabel: z.string().nullable(),
  primaryHref: z.string().nullable(),
  secondaryLabel: z.string().nullable(),
  secondaryHref: z.string().nullable(),
});
export type PublicHero = z.infer<typeof publicHeroSchema>;

export const publicHomeSectionSchema = z.object({
  id: z.string(),
  type: homeSectionTypeSchema,
  order: z.number().int(),
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  /** Заполнено только у type === 'hero'. */
  hero: publicHeroSchema.nullable(),
  /** Содержимое секции в блочном формате. */
  blocks: blocksSchema,
  href: z.string().nullable(),
});
export type PublicHomeSection = z.infer<typeof publicHomeSectionSchema>;

export const publicHomeSchema = z.object({
  sections: z.array(publicHomeSectionSchema),
  news: z.array(publicNewsCardSchema),
  links: z.array(publicLinkSchema),
  /** Медиа, на которые ссылаются блоки секций. */
  media: blockMediaMapSchema,
  documents: blockDocumentMapSchema,
  seo: publicSeoSchema,
});
export type PublicHome = z.infer<typeof publicHomeSchema>;

/* ---------------------------------------------------------- секции: админка */

/**
 * Секция главной страницы для редактирования — в отличие от публичной,
 * не сведена к одному языку: отдаёт все переводы разом, как остальные
 * сущности в разделе «Админка» (см. content.ts).
 */
export const homeSectionTranslationSchema = z.object({
  locale: localeSchema,
  eyebrow: z.string().trim().max(200).optional().nullable(),
  title: z.string().trim().max(300).optional().nullable(),
  subtitle: z.string().trim().max(1000).optional().nullable(),
  blocks: blocksSchema.default([]),
  primaryLabel: z.string().trim().max(100).optional().nullable(),
  primaryHref: z.string().trim().max(500).optional().nullable(),
  secondaryLabel: z.string().trim().max(100).optional().nullable(),
  secondaryHref: z.string().trim().max(500).optional().nullable(),
});
export type HomeSectionTranslation = z.infer<typeof homeSectionTranslationSchema>;

export const homeSectionSchema = z.object({
  id: z.string(),
  type: homeSectionTypeSchema,
  order: z.number().int(),
  isVisible: z.boolean(),
  /** Только для type === 'hero': постер — LCP-элемент баннера. */
  heroPosterId: z.string().nullable(),
  heroVideoId: z.string().nullable(),
  videoOnMobile: z.boolean(),
  href: z.string().nullable(),
  translations: z.array(homeSectionTranslationSchema),
});
export type HomeSection = z.infer<typeof homeSectionSchema>;

/**
 * Состав секций (их количество и типы) задаётся при наполнении сайта
 * контентом и здесь не меняется — редактируется содержимое существующих
 * секций: тексты, фотографии в блоках, кадры баннера, видимость.
 */
export const updateHomeSectionRequestSchema = z.object({
  isVisible: z.boolean().default(true),
  heroPosterId: z.string().optional().nullable(),
  heroVideoId: z.string().optional().nullable(),
  videoOnMobile: z.boolean().default(false),
  href: z.string().trim().max(1000).optional().nullable(),
  translations: z.array(homeSectionTranslationSchema).min(1, 'Заполните хотя бы один язык'),
});
export type UpdateHomeSectionRequest = z.infer<typeof updateHomeSectionRequestSchema>;

/* ============================================================================
   Каркас сайта: меню, настройки, языки. Один запрос на весь layout.
   ========================================================================== */

export interface PublicLayout {
  mainMenu: PublicMenuNode[];
  footerMenu: PublicMenuNode[];
  settings: PublicSettings;
  /** Языки, включённые в системе. */
  locales: ('kk' | 'ru' | 'en')[];
}

export interface PublicMenuNode {
  id: string;
  title: string;
  href: string;
  isExternal: boolean;
  children: PublicMenuNode[];
}

/* ============================================================================
   Карта сайта для sitemap.xml (п. IX ТЗ)
   ========================================================================== */

export const sitemapEntrySchema = z.object({
  path: z.string(),
  locale: localeSchema,
  updatedAt: isoDateSchema,
  /** Языки, на которых страница есть — для alternate-ссылок. */
  alternates: z.array(localeSchema),
  priority: z.number().min(0).max(1),
  changefreq: z.enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']),
});
export type SitemapEntry = z.infer<typeof sitemapEntrySchema>;
