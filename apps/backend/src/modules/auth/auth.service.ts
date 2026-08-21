import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import {
  ERROR_CODES,
  type LoginRequest,
  type SessionUser,
  type LoginResponse,
  type TotpRequiredResponse,
} from '@atm/contracts';
import { env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { TotpService } from './totp.service';
import { TokenService } from './token.service';
import { AuditService } from '../audit/audit.service';

interface RequestMeta {
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Вход в систему с защитой от перебора и двухфакторной аутентификацией
 * (пп. X.II и X.IV ТЗ).
 *
 * Порядок проверок важен: сначала блокировка, потом пароль, потом 2FA.
 * На неверный пароль и несуществующего пользователя ответ одинаков —
 * иначе перебором можно узнать, какие адреса зарегистрированы.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly totp: TotpService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async login(
    dto: LoginRequest,
    meta: RequestMeta,
  ): Promise<LoginResponse | TotpRequiredResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Единый ответ на «нет пользователя» и «неверный пароль».
    const invalid = () => {
      throw new UnauthorizedException('Неверный адрес электронной почты или пароль');
    };

    if (!user || !user.passwordHash) {
      // Хешируем впустую, чтобы время ответа не выдавало наличие аккаунта.
      await this.passwords.verify(
        '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$0000000000000000000000000000000000000000000',
        dto.password,
      );
      return invalid();
    }

    if (!user.isActive) {
      throw new ForbiddenException('Учётная запись деактивирована');
    }

    // 1. Блокировка после серии неудач (п. X.II ТЗ).
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException({
        statusCode: 403,
        code: ERROR_CODES.ACCOUNT_LOCKED,
        message: `Учётная запись временно заблокирована. Повторите через ${minutes} мин.`,
      });
    }

    // 2. Пароль.
    const ok = await this.passwords.verify(user.passwordHash, dto.password);
    if (!ok) {
      await this.registerFailure(user, meta);
      return invalid();
    }

    // 3. Второй фактор.
    if (user.twoFactorEnabled) {
      if (!dto.totp) {
        // Пароль верен, но нужен код. Пароль повторно не спрашиваем.
        return { totpRequired: true };
      }
      const secret = this.totp.decryptSecret(user.totpSecret!);
      const valid = this.totp.verify(dto.totp, secret) ||
        (await this.tryRecoveryCode(user, dto.totp));
      if (!valid) {
        await this.registerFailure(user, meta);
        throw new UnauthorizedException({
          statusCode: 401,
          code: ERROR_CODES.TOTP_INVALID,
          message: 'Неверный код двухфакторной аутентификации',
        });
      }
    }

    return this.completeLogin(user, meta);
  }

  /** Успешный вход: сброс счётчика, выпуск токенов, запись в журнал. */
  private async completeLogin(user: User, meta: RequestMeta): Promise<LoginResponse> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: meta.ip ?? null,
      },
    });

    const pair = await this.tokens.issuePair(
      { id: user.id, email: user.email, role: user.role, twoFactorEnabled: user.twoFactorEnabled },
      meta,
    );

    await this.audit.record({
      action: 'LOGIN_SUCCESS',
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      ...meta,
    });

    return { ...pair, user: this.toSessionUser(user) };
  }

  /** Неудачная попытка: инкремент счётчика и блокировка на пороге. */
  private async registerFailure(user: User, meta: RequestMeta): Promise<void> {
    const attempts = user.failedAttempts + 1;
    const max = env().LOGIN_MAX_ATTEMPTS;

    if (attempts >= max) {
      const lockedUntil = new Date(Date.now() + env().LOGIN_LOCK_MINUTES * 60000);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: attempts, lockedUntil },
      });
      await this.audit.record({
        action: 'ACCOUNT_LOCKED',
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        ...meta,
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: attempts },
      });
    }

    await this.audit.record({
      action: 'LOGIN_FAILED',
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      ...meta,
    });
  }

  /** Одноразовый код восстановления 2FA. При использовании сгорает. */
  private async tryRecoveryCode(user: User, code: string): Promise<boolean> {
    for (let i = 0; i < user.recoveryCodes.length; i++) {
      if (await this.passwords.verify(user.recoveryCodes[i], code)) {
        const remaining = user.recoveryCodes.filter((_, idx) => idx !== i);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { recoveryCodes: remaining },
        });
        return true;
      }
    }
    return false;
  }

  async refresh(refreshToken: string, meta: RequestMeta) {
    const pair = await this.tokens.rotate(refreshToken, meta);
    if (!pair) throw new UnauthorizedException('Сессия истекла, войдите заново');
    return pair;
  }

  async logout(refreshToken: string, user: { id: string; email: string }): Promise<void> {
    await this.tokens.revoke(refreshToken);
    await this.audit.record({
      action: 'LOGOUT',
      userId: user.id,
      userEmail: user.email,
    });
  }

  async me(userId: string): Promise<SessionUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.toSessionUser(user);
  }

  toSessionUser(user: User): SessionUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      uiLocale: user.uiLocale,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
