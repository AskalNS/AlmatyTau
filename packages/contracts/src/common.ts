import { z } from 'zod';

/* ============================================================================
   Языки (п. III ТЗ)
   ========================================================================== */

/**
 * Порядок значим: казахский первым — это государственный язык,
 * и он же первым выводится в переключателе языков на сайте.
 */
export const LOCALES = ['kk', 'ru', 'en'] as const;
export const localeSchema = z.enum(LOCALES);
export type Locale = z.infer<typeof localeSchema>;

/** Язык, на который уходит корневой URL и первый визит без Accept-Language. */
export const DEFAULT_LOCALE: Locale = 'ru';

export const LOCALE_LABELS: Record<Locale, string> = {
  kk: 'Қазақша',
  ru: 'Русский',
  en: 'English',
};

/** Короткие подписи для переключателя в шапке. */
export const LOCALE_SHORT: Record<Locale, string> = {
  kk: 'ҚАЗ',
  ru: 'РУС',
  en: 'ENG',
};

/** Значение атрибута lang и hreflang. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  kk: 'kk-KZ',
  ru: 'ru-KZ',
  en: 'en',
};

/* ============================================================================
   Роли и статусы
   ========================================================================== */

/** Ровно две роли, как предписывает п. V ТЗ. Третьей быть не должно. */
export const ROLES = ['ADMIN', 'EDITOR'] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Администратор',
  EDITOR: 'Редактор',
};

export const PUBLISH_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export const publishStatusSchema = z.enum(PUBLISH_STATUSES);
export type PublishStatus = z.infer<typeof publishStatusSchema>;

export const PUBLISH_STATUS_LABELS: Record<PublishStatus, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликовано',
  ARCHIVED: 'В архиве',
};

/* ============================================================================
   Примитивы
   ========================================================================== */

/**
 * Slug — только строчная латиница, цифры и дефис.
 *
 * Кириллица в URL сознательно запрещена: percent-encoding казахских букв
 * даёт нечитаемые ссылки, которые ломаются при копировании в документы
 * и письма. Транслитерация выполняется в админке при вводе заголовка.
 */
export const slugSchema = z
  .string()
  .min(1, 'Укажите адрес страницы')
  .max(160)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Допустимы только строчные латинские буквы, цифры и дефис',
  );

export const cuidSchema = z.string().min(1);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Некорректный адрес электронной почты')
  .max(254);

/** ISO-8601. Даты по сети всегда ходят строкой, не объектом Date. */
export const isoDateSchema = z.string().datetime({ offset: true });

/* ============================================================================
   Списки и пагинация
   ========================================================================== */

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface Paginated<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
}

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    meta: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
      hasNext: z.boolean(),
    }),
  });
}

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

/* ============================================================================
   SEO (п. IX ТЗ) — своё на каждый язык
   ========================================================================== */

export const seoSchema = z.object({
  /** ~60 символов: длиннее Google обрезает в выдаче. */
  title: z.string().trim().max(70).optional().nullable(),
  /** ~160 символов по той же причине. */
  description: z.string().trim().max(200).optional().nullable(),
  /** Картинка для соцсетей и мессенджеров. */
  ogImageId: z.string().optional().nullable(),
  /** Убрать страницу из индекса, не снимая с публикации. */
  noindex: z.boolean().default(false),
});
export type Seo = z.infer<typeof seoSchema>;

/* ============================================================================
   Ошибки API — единый формат для всех эндпоинтов
   ========================================================================== */

export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  /** Машиночитаемый код: по нему фронт решает, что делать. */
  code: z.string(),
  /** Текст для пользователя. Уже на русском, готов к показу. */
  message: z.string(),
  /** Ошибки валидации по полям: { email: ['Некорректный адрес'] } */
  fields: z.record(z.array(z.string())).optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const ERROR_CODES = {
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  TOTP_REQUIRED: 'TOTP_REQUIRED',
  TOTP_INVALID: 'TOTP_INVALID',
  /** Роль требует 2FA (п. X.II ТЗ), а она ещё не включена — доступны только эндпоинты её настройки. */
  TOTP_SETUP_REQUIRED: 'TOTP_SETUP_REQUIRED',
  INTERNAL: 'INTERNAL_ERROR',
} as const;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/* ============================================================================
   Переводы
   ========================================================================== */

/**
 * Статус перевода по каждому языку. Показывается в админке вкладками
 * KK / RU / EN, чтобы редактор видел, где текст ещё не готов.
 */
export const translationStatusSchema = z.object({
  locale: localeSchema,
  filled: z.boolean(),
});
export type TranslationStatus = z.infer<typeof translationStatusSchema>;

/**
 * Языки, на которых сущность реально опубликована.
 *
 * Ключевое архитектурное правило: при отсутствии перевода сущность
 * НЕ показывается на этом языке и НЕ подменяется другим языком.
 * Требование п. III ТЗ о независимом редактировании языковых версий.
 */
export type AvailableLocales = Locale[];
