import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  type InviteUserRequest,
  type UpdateUserRequest,
  type User as UserDto,
} from '@atm/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { TokenService } from '../auth/token.service';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { env } from '../../config/env';
import type { User } from '@prisma/client';

/**
 * Управление пользователями. Все методы доступны только Администратору —
 * это обеспечивает @Roles('ADMIN') на контроллере (п. V ТЗ).
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  private toDto(u: User): UserDto {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      twoFactorEnabled: u.twoFactorEnabled,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      lockedUntil: u.lockedUntil?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    };
  }

  async list(): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });
    return users.map((u) => this.toDto(u));
  }

  async invite(dto: InviteUserRequest, actor: AuditContext): Promise<UserDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Пользователь с таким адресом уже существует');
    }

    // Заводим неактивную запись без пароля и шлём одноразовое приглашение.
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        isActive: false,
      },
    });

    const token = this.passwords.randomToken();
    await this.prisma.invite.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 часов
        invitedById: actor.userId ?? null,
      },
    });

    await this.mail.sendInvite(dto.email, dto.name, token);

    await this.audit.record({
      action: 'USER_INVITED',
      entity: 'user',
      entityId: user.id,
      entityLabel: `${dto.name} <${dto.email}>`,
      ...actor,
    });

    return this.toDto(user);
  }

  async update(
    id: string,
    dto: UpdateUserRequest,
    actor: AuditContext,
  ): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    // Нельзя снять с себя роль администратора, если ты последний админ:
    // иначе система останется без владельца настроек и пользователей.
    if (dto.role && dto.role !== 'ADMIN' && user.role === 'ADMIN') {
      await this.assertNotLastAdmin(id);
    }
    if (dto.isActive === false && user.role === 'ADMIN') {
      await this.assertNotLastAdmin(id);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        isActive: dto.isActive,
      },
    });

    if (dto.isActive === false) {
      // Деактивация должна немедленно завершить активные сессии.
      await this.tokens.revokeAll(id);
    }

    await this.audit.record({
      action: dto.isActive === false ? 'USER_DEACTIVATED' : 'USER_UPDATED',
      entity: 'user',
      entityId: id,
      entityLabel: `${updated.name} <${updated.email}>`,
      changes: AuditService.diff(user as never, dto as never),
      ...actor,
    });

    return this.toDto(updated);
  }

  /** Разблокировка учётной записи администратором до истечения таймаута. */
  async unlock(id: string, actor: AuditContext): Promise<UserDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { lockedUntil: null, failedAttempts: 0 },
    });
    await this.audit.record({
      action: 'USER_UPDATED',
      entity: 'user',
      entityId: id,
      entityLabel: `${user.name} <${user.email}>`,
      changes: { lockedUntil: [true, false] },
      ...actor,
    });
    return this.toDto(user);
  }

  private async assertNotLastAdmin(excludeId: string): Promise<void> {
    const admins = await this.prisma.user.count({
      where: { role: 'ADMIN', isActive: true, id: { not: excludeId } },
    });
    if (admins === 0) {
      throw new ForbiddenException(
        'Нельзя лишить прав последнего администратора. Сначала назначьте другого.',
      );
    }
  }
}
