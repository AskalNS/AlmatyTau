import type { Role } from '@atm/contracts';

/**
 * Расширение типа Express.Request полем user, которое проставляет
 * JwtAuthGuard после проверки токена. Без этого TS не знает о req.user.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

export {};
