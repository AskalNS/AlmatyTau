import { z } from 'zod';
import { emailSchema, roleSchema, isoDateSchema } from './common.js';

/* ============================================================================
   Аутентификация и пользователи (п. V и X.II ТЗ)
   ========================================================================== */

/**
 * Парольная политика.
 *
 * Минимум 12 символов вместо привычных 8: п. X.II ТЗ требует «сложную
 * парольную политику», а восьмизначный пароль перебирается за часы.
 * Требование классов символов намеренно мягкое — длина защищает лучше,
 * чем обязательный спецсимвол, который люди обходят через «Password1!».
 */
export const PASSWORD_MIN = 12;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Пароль должен содержать не менее ${PASSWORD_MIN} символов`)
  .max(200, 'Пароль слишком длинный')
  .refine((v) => /[a-zа-яё]/i.test(v), 'Пароль должен содержать буквы')
  .refine((v) => /[0-9]/.test(v), 'Пароль должен содержать хотя бы одну цифру');

/* ------------------------------------------------------------------- вход */

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Введите пароль'),
  /** Код из приложения-аутентификатора. Запрашивается вторым шагом. */
  totp: z.string().regex(/^\d{6}$/, 'Код состоит из шести цифр').optional(),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const sessionUserSchema = z.object({
  id: z.string(),
  email: emailSchema,
  name: z.string(),
  role: roleSchema,
  twoFactorEnabled: z.boolean(),
  /** Язык интерфейса админки. Не связан с языком редактируемого контента. */
  uiLocale: z.enum(['kk', 'ru', 'en']),
  mustChangePassword: z.boolean(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: sessionUserSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/**
 * Ответ, когда пароль верный, но нужен код 2FA.
 * Пароль повторно не спрашивается — фронт присылает тот же запрос с полем totp.
 */
export const totpRequiredResponseSchema = z.object({
  totpRequired: z.literal(true),
});
export type TotpRequiredResponse = z.infer<typeof totpRequiredResponseSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

/* -------------------------------------------------------------------- 2FA */

export const totpSetupResponseSchema = z.object({
  /** Секрет в base32 — на случай ручного ввода. */
  secret: z.string(),
  /** otpauth://… для QR-кода. */
  otpauthUrl: z.string(),
  /** QR как data:image/png;base64 — внешних запросов не делаем. */
  qrDataUrl: z.string(),
});
export type TotpSetupResponse = z.infer<typeof totpSetupResponseSchema>;

export const totpConfirmRequestSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Код состоит из шести цифр'),
});
export type TotpConfirmRequest = z.infer<typeof totpConfirmRequestSchema>;

export const totpConfirmResponseSchema = z.object({
  /** Одноразовые коды на случай потери телефона. Показываются один раз. */
  recoveryCodes: z.array(z.string()),
});
export type TotpConfirmResponse = z.infer<typeof totpConfirmResponseSchema>;

/* ------------------------------------------------------------- пароли */

export const changePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'Новый пароль должен отличаться от текущего',
    path: ['newPassword'],
  });
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

export const acceptInviteRequestSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });
export type AcceptInviteRequest = z.infer<typeof acceptInviteRequestSchema>;

/* ------------------------------------------------------------ пользователи */

export const userSchema = z.object({
  id: z.string(),
  email: emailSchema,
  name: z.string(),
  role: roleSchema,
  isActive: z.boolean(),
  twoFactorEnabled: z.boolean(),
  lastLoginAt: isoDateSchema.nullable(),
  /** Заполнено, пока действует блокировка после серии неудачных попыток. */
  lockedUntil: isoDateSchema.nullable(),
  createdAt: isoDateSchema,
});
export type User = z.infer<typeof userSchema>;

export const inviteUserRequestSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2, 'Укажите имя').max(160),
  role: roleSchema,
});
export type InviteUserRequest = z.infer<typeof inviteUserRequestSchema>;

export const updateUserRequestSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  role: roleSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

/* ============================================================================
   Журнал действий (п. X.IV ТЗ)
   ========================================================================== */

export const AUDIT_ACTIONS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'ACCOUNT_LOCKED',
  'PASSWORD_CHANGED',
  'TOTP_ENABLED',
  'TOTP_DISABLED',
  'USER_INVITED',
  'USER_UPDATED',
  'USER_DEACTIVATED',
  'CREATE',
  'UPDATE',
  'DELETE',
  'PUBLISH',
  'UNPUBLISH',
  'UPLOAD',
  'SETTINGS_UPDATED',
] as const;
export const auditActionSchema = z.enum(AUDIT_ACTIONS);
export type AuditAction = z.infer<typeof auditActionSchema>;

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN_SUCCESS: 'Вход в систему',
  LOGIN_FAILED: 'Неудачная попытка входа',
  LOGOUT: 'Выход из системы',
  ACCOUNT_LOCKED: 'Учётная запись заблокирована',
  PASSWORD_CHANGED: 'Смена пароля',
  TOTP_ENABLED: 'Включена двухфакторная аутентификация',
  TOTP_DISABLED: 'Отключена двухфакторная аутентификация',
  USER_INVITED: 'Приглашён пользователь',
  USER_UPDATED: 'Изменён пользователь',
  USER_DEACTIVATED: 'Пользователь деактивирован',
  CREATE: 'Создание',
  UPDATE: 'Изменение',
  DELETE: 'Удаление',
  PUBLISH: 'Публикация',
  UNPUBLISH: 'Снятие с публикации',
  UPLOAD: 'Загрузка файла',
  SETTINGS_UPDATED: 'Изменены настройки',
};

export const auditEntrySchema = z.object({
  id: z.string(),
  action: auditActionSchema,
  /** Тип объекта: news, page, document… Пусто для входов в систему. */
  entity: z.string().nullable(),
  entityId: z.string().nullable(),
  /** Человекочитаемое имя объекта на момент действия. */
  entityLabel: z.string().nullable(),
  userId: z.string().nullable(),
  userEmail: z.string().nullable(),
  userName: z.string().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  /** Что изменилось: { поле: [было, стало] }. */
  changes: z.record(z.tuple([z.unknown(), z.unknown()])).nullable(),
  createdAt: isoDateSchema,
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  action: auditActionSchema.optional(),
  userId: z.string().optional(),
  entity: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
export type AuditQuery = z.infer<typeof auditQuerySchema>;
