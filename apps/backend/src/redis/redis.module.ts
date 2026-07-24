import { Global, Module, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from '../config/env';
import { CacheService } from './cache.service';
import { REDIS } from './redis.tokens';

// Реэкспорт для обратной совместимости: часть модулей импортирует REDIS отсюда.
export { REDIS };

/**
 * Redis обслуживает кэш публичного API, счётчики rate-limit и хранилище
 * состояния throttler между перезапусками. Один клиент на приложение.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: () => {
        const logger = new Logger('Redis');
        const client = new Redis(env().REDIS_URL, {
          maxRetriesPerRequest: 3,
          lazyConnect: false,
        });
        client.on('connect', () => logger.log('Соединение с Redis установлено'));
        client.on('error', (e) => logger.error(`Redis: ${e.message}`));
        return client;
      },
    },
    CacheService,
  ],
  exports: [REDIS, CacheService],
})
export class RedisModule {}
