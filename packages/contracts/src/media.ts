import { z } from 'zod';
import { localeSchema, isoDateSchema, slugSchema } from './common.js';

/* ============================================================================
   Медиафайлы и медиагалерея (п. 5.2 и VI ТЗ)
   ========================================================================== */

export const MEDIA_KINDS = ['IMAGE', 'VIDEO', 'FILE'] as const;
export const mediaKindSchema = z.enum(MEDIA_KINDS);
export type MediaKind = z.infer<typeof mediaKindSchema>;

/**
 * Разрешённые типы загрузки.
 *
 * Проверяется не расширение, а сигнатура файла: расширение подделывается
 * тривиально, и переименованный в .jpg скрипт — классический вектор
 * внедрения вредоносного кода (п. X.III ТЗ). SVG в списке нет намеренно:
 * это XML, внутри которого исполняется JavaScript.
 */
export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/webm'] as const;

export const ALLOWED_FILE_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const;

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; //  15 МБ
export const MAX_VIDEO_BYTES = 512 * 1024 * 1024; // 512 МБ
export const MAX_FILE_BYTES = 64 * 1024 * 1024; //  64 МБ

/** Размеры, в которых сохраняется каждое изображение (ширина в px). */
export const IMAGE_SIZES = [400, 800, 1280, 1920] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];

export const imageVariantSchema = z.object({
  width: z.number().int(),
  height: z.number().int(),
  /** Ключи в хранилище по форматам: современные и запасной jpeg. */
  avif: z.string(),
  webp: z.string(),
  fallback: z.string(),
});
export type ImageVariant = z.infer<typeof imageVariantSchema>;

export const mediaSchema = z.object({
  id: z.string(),
  kind: mediaKindSchema,
  /** Имя файла при загрузке — показывается редактору для узнавания. */
  originalName: z.string(),
  mime: z.string(),
  size: z.number().int(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  /** Длительность видео в секундах. */
  duration: z.number().int().nullable(),
  /** Готовый публичный URL исходника или запасного формата. */
  url: z.string(),
  /**
   * Ключ blurhash-заглушки: показывается, пока грузится картинка.
   * Убирает дёрганье вёрстки и улучшает восприятие скорости (п. VIII ТЗ).
   */
  blurhash: z.string().nullable(),
  variants: z.array(imageVariantSchema).default([]),
  /**
   * Альтернативный текст по языкам.
   *
   * Обязателен минимум на одном языке — без него изображение не сохранится.
   * Это требование п. VI ТЗ о версии для слабовидящих: если alt не сделать
   * обязательным на входе, через месяц эксплуатации его не будет нигде.
   */
  alt: z.record(localeSchema, z.string()),
  caption: z.record(localeSchema, z.string()).nullable(),
  /** Источник и дата съёмки — требование п. 5.2 ТЗ. */
  source: z.string().nullable(),
  takenAt: isoDateSchema.nullable(),
  createdAt: isoDateSchema,
  uploadedById: z.string().nullable(),
});
export type Media = z.infer<typeof mediaSchema>;

export const updateMediaRequestSchema = z.object({
  alt: z.record(localeSchema, z.string().trim().max(500)).optional(),
  caption: z.record(localeSchema, z.string().trim().max(1000)).optional(),
  source: z.string().trim().max(300).optional().nullable(),
  takenAt: z.string().optional().nullable(),
});
export type UpdateMediaRequest = z.infer<typeof updateMediaRequestSchema>;

export const mediaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(40),
  kind: mediaKindSchema.optional(),
  search: z.string().trim().max(200).optional(),
});
export type MediaQuery = z.infer<typeof mediaQuerySchema>;

/* ------------------------------------------------------------- альбомы */

export const albumTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().trim().min(1, 'Укажите название').max(300),
  description: z.string().trim().max(3000).optional().nullable(),
});
export type AlbumTranslation = z.infer<typeof albumTranslationSchema>;

export const albumSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  coverId: z.string().nullable(),
  publishedAt: isoDateSchema.nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  /** Позиция в списке галереи: порядок альбомов задаёт редактор. */
  order: z.number().int(),
  mediaIds: z.array(z.string()),
  translations: z.array(albumTranslationSchema),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Album = z.infer<typeof albumSchema>;

/** Альбом в публичном API — уже сведённый к одному языку. */
export const publicAlbumSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  title: z.string(),
  description: z.string().nullable(),
  cover: mediaSchema.nullable(),
  items: z.array(mediaSchema),
  publishedAt: isoDateSchema.nullable(),
  /** Число файлов — подпись на карточке и в заголовке альбома. */
  count: z.number().int(),
});
export type PublicAlbum = z.infer<typeof publicAlbumSchema>;

export const upsertAlbumRequestSchema = z.object({
  slug: slugSchema,
  coverId: z.string().optional().nullable(),
  mediaIds: z.array(z.string()).max(500).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  order: z.number().int().default(0),
  publishedAt: z.string().optional().nullable(),
  translations: z.array(albumTranslationSchema).min(1, 'Заполните хотя бы один язык'),
});
export type UpsertAlbumRequest = z.infer<typeof upsertAlbumRequestSchema>;
