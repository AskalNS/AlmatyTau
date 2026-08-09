import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import Redis from 'ioredis';

import { validateEnv, env } from './config/env';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';

// Инфраструктурные модули
import { AuditModule } from './modules/audit/audit.module';
import { MailModule } from './modules/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { MediaModule } from './modules/media/media.module';
import { SearchModule } from './modules/search/search.module';
import { SettingsModule } from './modules/settings/settings.module';

// Контентные модули
import { UsersModule } from './modules/users/users.module';
import { NewsModule } from './modules/news/news.module';
import { PagesModule } from './modules/pages/pages.module';
import { PersonsModule } from './modules/persons/persons.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { VacanciesModule } from './modules/vacancies/vacancies.module';
import { AlbumsModule } from './modules/albums/albums.module';
import { LinksModule } from './modules/links/links.module';
import { MenuModule } from './modules/menu/menu.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { HomeModule } from './modules/home/home.module';
import { SiteModule } from './modules/site/site.module';

/**
 * Корневой модуль.
 *
 * Каждый раздел сайта — отдельный модуль в src/modules. Это модульный
 * монолит: жёсткие границы внутри одного процесса вместо сетевых границ
 * микросервисов. Модуль не импортирует внутренности соседа — только его
 * экспортируемый сервис (см. ARCHITECTURE.md).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Единая валидация окружения: приложение не стартует с кривым .env.
      validate: (raw) => validateEnv(raw),
    }),

    // Инфраструктура (все глобальные)
    PrismaModule,
    RedisModule,
    CommonModule,
    AuditModule,
    MailModule,
    AuthModule,
    MediaModule,
    SearchModule,
    SettingsModule,

    // Ограничение частоты запросов (п. X.II ТЗ). Состояние в Redis —
    // переживает перезапуск и работает при нескольких инстансах.
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [{ ttl: 60_000, limit: 120 }],
        storage: new ThrottlerStorageRedisService(new Redis(env().REDIS_URL)),
      }),
    }),

    // Контент
    HealthModule,
    UsersModule,
    NewsModule,
    PagesModule,
    PersonsModule,
    DocumentsModule,
    VacanciesModule,
    AlbumsModule,
    LinksModule,
    MenuModule,
    FeedbackModule,
    HomeModule,
    SiteModule,
  ],
  providers: [
    // Глобальный rate-limit поверх всех роутов.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
