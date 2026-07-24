import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger, VersioningType } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { env, corsOrigins } from './config/env';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Логи буферизуются, пока не поднимется наш логгер.
    bufferLogs: true,
  });

  // За nginx: доверяем X-Forwarded-* от первого прокси, чтобы rate-limit
  // и журнал аудита видели реальный IP клиента, а не адрес контейнера.
  app.set('trust proxy', 1);

  // helmet ставит заголовки безопасности (п. X.III ТЗ). CSP на API не нужен —
  // это не HTML; им занимается nginx и фронтенды.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
  app.use(cookieParser());

  // Единственный префикс. health тоже под /api — так nginx проксирует
  // одним правилом location /api.
  app.setGlobalPrefix('api');

  // Строгий CORS-allowlist (п. X.III). Звёздочки нет: фронты известны.
  app.enableCors({
    origin: corsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  // Тело запроса ограничено: JSON с контентом страниц бывает крупным
  // из-за блоков, но не мегабайты. Файлы идут отдельным multipart-роутом.
  app.useBodyParser('json', { limit: '2mb' });

  const reflector = app.get(Reflector);
  const jwt = app.get(JwtService);

  // Глобальные гварды: всё закрыто, кроме @Public; роли проверяются вторым.
  app.useGlobalGuards(new JwtAuthGuard(reflector, jwt), new RolesGuard(reflector));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger — прямое требование п. II ТЗ (документированный REST API
  // для интеграции с системами Заказчика).
  if (env().NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('ATM API')
      .setDescription('REST API официального сайта ТОО «Almaty Tau Management»')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log('Swagger доступен на /api/docs');
  }

  // Мягкое завершение: дожидаемся закрытия соединений с БД (onModuleDestroy).
  app.enableShutdownHooks();

  const port = env().PORT;
  await app.listen(port, '0.0.0.0');
  logger.log(`API запущен на порту ${port}`);
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Не удалось запустить приложение:', e);
  process.exit(1);
});
