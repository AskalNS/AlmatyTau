import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';
import { Public } from '../modules/auth/decorators/public.decorator';

/**
 * Проверка живости. Дёргается healthcheck'ом Docker и nginx.
 * Публичный: ходит без авторизации.
 */
@ApiTags('Служебное')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Проверка работоспособности сервиса' })
  async check() {
    const [db, cache] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.redis.ping(),
    ]);

    const dbOk = db.status === 'fulfilled';
    const cacheOk = cache.status === 'fulfilled';
    const ok = dbOk && cacheOk;

    return {
      status: ok ? 'ok' : 'degraded',
      checks: {
        database: dbOk ? 'up' : 'down',
        redis: cacheOk ? 'up' : 'down',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
