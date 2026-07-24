import { BadRequestException } from '@nestjs/common';
import { LOCALES, type Locale } from '@atm/contracts';

/**
 * Помощники для сведения многоязычной сущности к одному языку.
 *
 * Собраны в одном месте, потому что правило «нет перевода — нет сущности
 * на этом языке» (п. III ТЗ) применяется одинаково во всех публичных
 * эндпоинтах, и дублировать его в каждом модуле — путь к рассинхрону.
 */

/** Парсит и валидирует locale из query. По умолчанию — русский. */
export function parseLocale(value: unknown): Locale {
  if (typeof value === 'string' && (LOCALES as readonly string[]).includes(value)) {
    return value as Locale;
  }
  if (value === undefined || value === null || value === '') {
    return 'ru';
  }
  throw new BadRequestException(`Неизвестный язык: ${String(value)}`);
}

interface HasLocale {
  locale: Locale;
}

/**
 * Возвращает перевод строго на запрошенном языке или null.
 *
 * Сознательно НЕ делает фолбэк на другой язык: если казахская версия
 * не переведена, на казахском сайте её быть не должно, а не должен
 * появиться русский текст (п. III ТЗ).
 */
export function pickTranslation<T extends HasLocale>(
  translations: T[],
  locale: Locale,
): T | null {
  return translations.find((t) => t.locale === locale) ?? null;
}

/** Список языков, на которых сущность реально переведена. */
export function availableLocales<T extends HasLocale>(translations: T[]): Locale[] {
  const set = new Set(translations.map((t) => t.locale));
  return LOCALES.filter((l) => set.has(l));
}

/**
 * SEO-объект для публичной выдачи. Title обязателен — если в переводе
 * его нет, берём заголовок сущности.
 */
export function buildSeo(
  translation: {
    title: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoOgImageId?: string | null;
    seoNoindex?: boolean;
  },
  available: Locale[],
  ogImageUrl: string | null,
) {
  return {
    title: translation.seoTitle || translation.title,
    description: translation.seoDescription ?? null,
    ogImage: ogImageUrl,
    noindex: translation.seoNoindex ?? false,
    availableLocales: available,
  };
}
