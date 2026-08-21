import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  loginRequestSchema,
  refreshRequestSchema,
  changePasswordRequestSchema,
  totpConfirmRequestSchema,
  acceptInviteRequestSchema,
  type LoginRequest,
  type RefreshRequest,
  type ChangePasswordRequest,
  type TotpConfirmRequest,
  type AcceptInviteRequest,
} from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { AuditService } from '../audit/audit.service';
import { Public } from './decorators/public.decorator';
import { Skip2FAEnforcement } from './decorators/skip-2fa.decorator';
import { CurrentUser, type AuthUser } from './decorators/current-user.decorator';

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly account: AccountService,
  ) {}

  /**
   * Вход. Ограничение частоты жёстче общего (п. X.II — защита от перебора):
   * не более 5 попыток в минуту с одного адреса, поверх блокировки аккаунта.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Вход в систему' })
  login(
    @Body(zodBody(loginRequestSchema)) dto: LoginRequest,
    @Req() req: Request,
  ) {
    return this.auth.login(dto, AuditService.contextFromRequest(req));
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  @ApiOperation({ summary: 'Обновление пары токенов' })
  refresh(
    @Body(zodBody(refreshRequestSchema)) dto: RefreshRequest,
    @Req() req: Request,
  ) {
    return this.auth.refresh(dto.refreshToken, AuditService.contextFromRequest(req));
  }

  @Skip2FAEnforcement()
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Выход' })
  async logout(
    @Body(zodBody(refreshRequestSchema)) dto: RefreshRequest,
    @CurrentUser() user: AuthUser,
  ) {
    await this.auth.logout(dto.refreshToken, user);
    return { ok: true };
  }

  @Skip2FAEnforcement()
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Текущий пользователь' })
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }

  @Skip2FAEnforcement()
  @Post('password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Смена собственного пароля' })
  async changePassword(
    @Body(zodBody(changePasswordRequestSchema)) dto: ChangePasswordRequest,
    @CurrentUser('id') userId: string,
  ) {
    await this.account.changePassword(userId, dto);
    return { ok: true };
  }

  @Skip2FAEnforcement()
  @Post('totp/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Начать подключение 2FA: получить секрет и QR' })
  setupTotp(@CurrentUser('id') userId: string) {
    return this.account.setupTotp(userId);
  }

  @Skip2FAEnforcement()
  @Post('totp/confirm')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Подтвердить код и включить 2FA' })
  confirmTotp(
    @Body(zodBody(totpConfirmRequestSchema)) dto: TotpConfirmRequest,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    return this.account.confirmTotp(userId, dto.code, AuditService.contextFromRequest(req));
  }

  @Post('totp/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отключить 2FA (недоступно администратору)' })
  async disableTotp(
    @Body(zodBody(totpConfirmRequestSchema)) dto: TotpConfirmRequest,
    @CurrentUser('id') userId: string,
  ) {
    await this.account.disableTotp(userId, dto.code);
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('invite/accept')
  @ApiOperation({ summary: 'Принять приглашение и задать пароль' })
  async acceptInvite(
    @Body(zodBody(acceptInviteRequestSchema)) dto: AcceptInviteRequest,
  ) {
    await this.account.acceptInvite(dto);
    return { ok: true };
  }
}
