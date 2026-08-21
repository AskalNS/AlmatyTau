import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  type ChangePasswordRequest,
  type TotpSetupResponse,
  type TotpConfirmResponse,
  type AcceptInviteRequest,
} from '@atm/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { TotpService } from './totp.service';
import { TokenService } from './token.service';
import { AuditService } from '../audit/audit.service';

/**
 * Управление собственной учётной записью: смена пароля, включение 2FA,
 * принятие приглашения. Отделено от AuthService, который занят только входом.
 */
@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly totp: TotpService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async changePassword(userId: string, dto: ChangePasswordRequest): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) throw new UnauthorizedException();

    const ok = await this.passwords.verify(user.passwordHash, dto.currentPassword);
    if (!ok) throw new BadRequestException({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Текущий пароль указан неверно',
      fields: { currentPassword: ['Текущий пароль указан неверно'] },
    });

    const passwordHash = await this.passwords.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });

    // Смена пароля завершает все прочие сессии — украденный токен умирает.
    await this.tokens.revokeAll(userId);

    await this.audit.record({
      action: 'PASSWORD_CHANGED',
      userId,
      userEmail: user.email,
      userName: user.name,
    });
  }

  /** Шаг 1 включения 2FA: сгенерировать секрет и QR. Пока не активируем. */
  async setupTotp(userId: string): Promise<TotpSetupResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const secret = this.totp.generateSecret();
    const otpauthUrl = this.totp.keyUri(user.email, secret);
    const qrDataUrl = await this.totp.qrDataUrl(otpauthUrl);

    // Секрет сохраняем зашифрованным, но twoFactorEnabled ещё false:
    // 2FA включится только после подтверждения кодом на шаге 2.
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: this.totp.encryptSecret(secret) },
    });

    return { secret, otpauthUrl, qrDataUrl };
  }

  /** Шаг 2: подтвердить код, включить 2FA, выдать коды восстановления. */
  async confirmTotp(
    userId: string,
    code: string,
    meta: { ip?: string | null; userAgent?: string | null },
  ): Promise<TotpConfirmResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) {
      throw new BadRequestException('Сначала запросите настройку двухфакторной аутентификации');
    }

    const secret = this.totp.decryptSecret(user.totpSecret);
    if (!this.totp.verify(code, secret)) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'TOTP_INVALID',
        message: 'Неверный код. Проверьте время на устройстве и повторите.',
      });
    }

    const { plain, hashed } = await this.passwords.generateRecoveryCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, recoveryCodes: hashed },
    });

    await this.audit.record({
      action: 'TOTP_ENABLED',
      userId,
      userEmail: user.email,
      userName: user.name,
    });

    // Переиздаём пару токенов сразу с twoFactorEnabled=true — иначе для
    // ADMIN принудительная проверка 2FA в JwtAuthGuard тут же заблокирует
    // собственным же старым токеном все остальные действия до его истечения.
    const tokens = await this.tokens.issuePair(
      { id: user.id, email: user.email, role: user.role, twoFactorEnabled: true },
      meta,
    );

    return { recoveryCodes: plain, ...tokens };
  }

  /**
   * Отключение 2FA. Администратору отключать себе 2FA запрещено —
   * п. X.II требует обязательный второй фактор для роли Администратор.
   */
  async disableTotp(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret || !user.twoFactorEnabled) {
      throw new BadRequestException('Двухфакторная аутентификация не включена');
    }
    if (user.role === 'ADMIN') {
      throw new ForbiddenException(
        'Двухфакторная аутентификация обязательна для администратора и не может быть отключена',
      );
    }

    const secret = this.totp.decryptSecret(user.totpSecret);
    if (!this.totp.verify(code, secret)) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'TOTP_INVALID',
        message: 'Неверный код',
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, totpSecret: null, recoveryCodes: [] },
    });

    await this.audit.record({
      action: 'TOTP_DISABLED',
      userId,
      userEmail: user.email,
      userName: user.name,
    });
  }

  /** Принятие приглашения: пользователь задаёт пароль по одноразовой ссылке. */
  async acceptInvite(dto: AcceptInviteRequest): Promise<void> {
    const invite = await this.prisma.invite.findUnique({
      where: { tokenHash: this.hashToken(dto.token) },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException('Приглашение недействительно или срок его действия истёк');
    }

    const passwordHash = await this.passwords.hash(dto.password);

    await this.prisma.$transaction([
      this.prisma.user.upsert({
        where: { email: invite.email },
        update: { passwordHash, isActive: true, mustChangePassword: false },
        create: {
          email: invite.email,
          name: invite.name,
          role: invite.role,
          passwordHash,
        },
      }),
      this.prisma.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);
  }
}
