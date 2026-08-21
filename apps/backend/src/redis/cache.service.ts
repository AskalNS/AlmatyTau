import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from './redis.tokens';
import { env } from '../config/env';

/**
 * Кэш ответов публичного API (п. VIII ТЗ — механизмы кеширования).
 *
 * Ключи группируются по тегам, чтобы при публикации новости сбросить
 * разом всё, что от неё зависит: саму новость, ленту, главную, sitemap.
 * Точечная инвалидация по одному ключу тут невозможна — новость влияет
 * на несколько страниц сразу.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly prefix = 'cache:';

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(this.prefix + key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300, tags: string[] = []): Promise<void> {
    const fullKey = this.prefix + key;
    const pipeline = this.redis.pipeline();
    pipeline.set(fullKey, JSON.stringify(value), 'EX', ttlSeconds);
    // Регистрируем ключ в множествах его тегов для последующего сброса.
    for (const tag of tags) {
      pipeline.sadd(`tag:${tag}`, fullKey);
      pipeline.expire(`tag:${tag}`, ttlSeconds + 60);
    }
    await pipeline.exec();
  }

  /**
   * Обёртка read-through: вернуть из кэша либо посчитать, положить и вернуть.
   * Основной способ использования из контроллеров публичного API.
   */
  async wrap<T>(
    key: string,
    ttlSeconds: number,
    tags: string[],
    factory: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await factory();
    await this.set(key, value, ttlSeconds, tags);
    return value;
  }

  /**
   * Сброс всех ключей, помеченных тегами. Дёргается при изменении контента.
   *
   * Помимо собственного кэша API сбрасывает ISR-кэш публичного сайта тем же
   * набором тегов — иначе редактор публикует правку, наш кэш чистится сразу,
   * а Next.js ещё до 5 минут отдаёт старую страницу из своего собственного
   * кэша (те же теги на fetch() в apps/web, см. app/api/revalidate/route.ts).
   */
  async invalidateTags(...tags: string[]): Promise<void> {
    for (const tag of tags) {
      const setKey = `tag:${tag}`;
      const keys = await this.redis.smembers(setKey);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      await this.redis.del(setKey);
    }
    this.logger.debug(`Сброшен кэш по тегам: ${tags.join(', ')}`);
    await this.revalidateWeb(tags);
  }

  /** Не должно ронять сохранение контента, если сайт временно недоступен. */
  private async revalidateWeb(tags: string[]): Promise<void> {
    const { WEB_INTERNAL_URL, REVALIDATE_SECRET } = env();
    if (!REVALIDATE_SECRET) return;
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`${WEB_INTERNAL_URL}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': REVALIDATE_SECRET,
        },
        body: JSON.stringify({ tags }),
        signal: ctrl.signal,
      }).finally(() => clearTimeout(timeout));
      if (!res.ok) {
        this.logger.warn(`Ревалидация сайта вернула ${res.status} для тегов: ${tags.join(', ')}`);
      }
    } catch (e) {
      this.logger.warn(
        `Не удалось сбросить ISR-кэш сайта (теги: ${tags.join(', ')}): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
