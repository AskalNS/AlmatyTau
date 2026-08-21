import { z } from 'zod';

/* ============================================================================
   Валидация окружения.

   Проверяется один раз при старте. Если секрет не задан или слишком короткий,
   приложение падает сразу с понятной ошибкой, а не через час работы на первом
   запросе, где-нибудь в глубине JWT-модуля.
   ========================================================================== */

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().int().default(4000),
  TZ: z.string().default('Asia/Almaty'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // --- Хранилище файлов ---
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_PUBLIC_URL: z.string().url(),

  // --- JWT ---
  // Два разных секрета по 32+ символа. Совпадение секретов позволило бы
  // подсунуть refresh-токен там, где ждут access.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET: минимум 32 символа'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET: минимум 32 символа'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // --- Безопасность (п. X ТЗ) ---
  TOTP_ISSUER: z.string().default('ATM Admin'),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(3).default(5),
  LOGIN_LOCK_MINUTES: z.coerce.number().int().min(1).default(15),
  PASSWORD_MIN_LENGTH: z.coerce.number().int().min(8).default(12),
  CORS_ORIGINS: z.string().min(1),

  // --- Почта ---
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  MAIL_FROM: z.string().default('ATM <noreply@atm.kz>'),
  FEEDBACK_TO: z.string().default('info@atm.kz'),

  // --- Первичный администратор ---
  SEED_ADMIN_EMAIL: z.string().email().default('admin@atm.kz'),
  SEED_ADMIN_PASSWORD: z.string().default(''),

  // --- Внешнее ---
  PUBLIC_WEB_URL: z.string().url().default('http://localhost:3000'),
  // Внутри сети compose, в обход nginx и блок-листа по IP — тем же путём,
  // каким web ходит в backend через API_INTERNAL_URL (см. docker-compose.yml).
  WEB_INTERNAL_URL: z.string().url().default('http://web:3000'),
  REVALIDATE_SECRET: z.string().default(''),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Некорректное окружение:\n${issues}`);
  }
  cached = parsed.data;
  return parsed.data;
}

export function env(): Env {
  if (!cached) throw new Error('Окружение ещё не провалидировано');
  return cached;
}

/** Строгий allow-list CORS. Звёздочка недопустима — фронты известны заранее. */
export function corsOrigins(): string[] {
  return env()
    .CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
