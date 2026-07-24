import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from './redis.tokens';

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

  /** Сброс всех ключей, помеченных тегами. Дёргается при изменении контента. */
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
  }
}
