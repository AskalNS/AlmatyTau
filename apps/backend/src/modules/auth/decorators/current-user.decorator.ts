import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@atm/contracts';

/** Полезная нагрузка access-токена, положенная в request гвардом. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/**
 * Достаёт текущего пользователя из запроса.
 * @example  create(@CurrentUser() user: AuthUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    return data ? user?.[data] : user;
  },
);
