import type { Locale } from '@atm/contracts';

/**
 * Клиент публичного API.
 *
 * Внутри Docker сайт ходит в бэкенд напрямую по имени сервиса
 * (API_INTERNAL_URL), минуя nginx и интернет — это быстрее и не зависит
 * от внешнего DNS. В браузере, если понадобится, используется публичный URL.
 */
const INTERNAL = process.env.API_INTERNAL_URL || 'http://localhost:4000';

type FetchOpts = {
  /** Секунды ISR-ревалидации. 0 — не кэшировать. */
  revalidate?: number;
  tags?: string[];
};

async function apiGet<T>(
  path: string,
  locale: Locale,
  opts: FetchOpts = {},
): Promise<T> {
  const url = new URL(`${INTERNAL}${path}`);
  if (!url.searchParams.has('locale')) url.searchParams.set('locale', locale);

  const res = await fetch(url.toString(), {
    next: {
      revalidate: opts.revalidate ?? 120,
      tags: opts.tags,
    },
    headers: { Accept: 'application/json' },
  });

  if (res.status === 404) {
    // Пробрасываем как null — вызывающий решает, показывать 404 или пусто.
    throw new ApiNotFound(path);
  }
  if (!res.ok) {
    throw new Error(`API ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export class ApiNotFound extends Error {
  constructor(path: string) {
    super(`Not found: ${path}`);
    this.name = 'ApiNotFound';
  }
}

/** Безопасный вариант: возвращает null вместо исключения на 404. */
export async function apiGetOrNull<T>(
  path: string,
  locale: Locale,
  opts: FetchOpts = {},
): Promise<T | null> {
  try {
    return await apiGet<T>(path, locale, opts);
  } catch (e) {
    if (e instanceof ApiNotFound) return null;
    throw e;
  }
}

export { apiGet };
