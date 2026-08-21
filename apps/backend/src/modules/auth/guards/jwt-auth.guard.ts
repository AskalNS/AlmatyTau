import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ERROR_CODES } from '@atm/contracts';
import { env } from '../../../config/env';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_2FA_KEY } from '../decorators/skip-2fa.decorator';
import type { AuthUser } from '../decorators/current-user.decorator';

/**
 * Глобальный гвард: закрывает всё, кроме роутов, помеченных @Public().
 *
 * «Закрыто по умолчанию» — сознательный выбор: защиту нельзя забыть навесить,
 * можно только осознанно снять. Обратный подход рано или поздно оставляет
 * незащищённый эндпоинт.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Требуется авторизация');

    try {
      const payload = await this.jwt.verifyAsync<AuthUser & { typ?: string }>(token, {
        secret: env().JWT_ACCESS_SECRET,
      });
      // Refresh-токен не должен проходить как access, даже если подпись верна.
      if (payload.typ && payload.typ !== 'access') {
        throw new UnauthorizedException();
      }
      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        twoFactorEnabled: payload.twoFactorEnabled,
      };

      // Принудительная 2FA для ADMIN (п. X.II ТЗ): пароль сам по себе не
      // должен давать полный доступ, если админ так и не включил второй
      // фактор — иначе требование «есть 2FA» выполняется формально, а
      // фактически рубеж защиты просто не работает. Открыт только путь,
      // необходимый, чтобы её включить (см. Skip2FAEnforcement).
      const skip2fa = this.reflector.getAllAndOverride<boolean>(SKIP_2FA_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
      if (!skip2fa && payload.role === 'ADMIN' && !payload.twoFactorEnabled) {
        throw new ForbiddenException({
          statusCode: 403,
          code: ERROR_CODES.TOTP_SETUP_REQUIRED,
          message: 'Для этой роли обязательна двухфакторная аутентификация — сначала включите её в профиле.',
        });
      }

      return true;
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('Сессия истекла, войдите заново');
    }
  }

  private extractToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header) return null;
    const [scheme, value] = header.split(' ');
    return scheme === 'Bearer' && value ? value : null;
  }
}
