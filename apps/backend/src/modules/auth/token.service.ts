import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import type { Role } from '@atm/contracts';
import { env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AccessPayload {
  id: string;
  email: string;
  role: Role;
  twoFactorEnabled: boolean;
  typ: 'access';
}

/**
 * Выпуск и ротация JWT.
 *
 * Access живёт коротко (15 мин) и не хранится на сервере. Refresh живёт
 * долго (7 дней), но в БД лежит только его SHA-256: если дамп утечёт,
 * восстановить рабочий токен из хеша нельзя. При каждом обновлении старый
 * refresh отзывается и выдаётся новый — украденный токен работает
 * до первого легитимного обновления, дальше становится недействительным.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issuePair(
    user: { id: string; email: string; role: Role; twoFactorEnabled: boolean },
    meta: { ip?: string | null; userAgent?: string | null },
  ): Promise<TokenPair> {
    const accessPayload: AccessPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      typ: 'access',
    };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: env().JWT_ACCESS_SECRET,
      expiresIn: env().JWT_ACCESS_TTL,
    });

    const refreshToken = await this.jwt.signAsync(
      { id: user.id, typ: 'refresh' },
      { secret: env().JWT_REFRESH_SECRET, expiresIn: env().JWT_REFRESH_TTL },
    );

    // Дата истечения для очистки таблицы и проверки при обновлении.
    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(decoded.exp * 1000),
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      },
    });

    return { accessToken, refreshToken };
  }

  /** Проверяет refresh, отзывает его и выдаёт новую пару (ротация). */
  async rotate(
    refreshToken: string,
    meta: { ip?: string | null; userAgent?: string | null },
  ): Promise<TokenPair | null> {
    let payload: { id: string; typ?: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: env().JWT_REFRESH_SECRET,
      });
    } catch {
      return null;
    }
    if (payload.typ !== 'refresh') return null;

    const hash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
    });

    // Нет записи, уже отозван или просрочен — обновление невозможно.
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return null;
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) return null;

    // Отзываем старый и выдаём новый в одной транзакции.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issuePair(
      { id: user.id, email: user.email, role: user.role, twoFactorEnabled: user.twoFactorEnabled },
      meta,
    );
  }

  /** Выход: отзыв конкретного refresh-токена. */
  async revoke(refreshToken: string): Promise<void> {
    const hash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Отзыв всех сессий пользователя: при смене пароля, блокировке. */
  async revokeAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
