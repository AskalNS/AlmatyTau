import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { updateSettingsRequestSchema, type UpdateSettingsRequest } from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { SettingsService } from './settings.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

/**
 * Настройки сайта. Только Администратор (п. V ТЗ — это технические
 * настройки, недоступные Редактору).
 */
@ApiTags('Настройки')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Текущие настройки' })
  get() {
    return this.settings.adminGet();
  }

  @Put()
  @ApiOperation({ summary: 'Сохранить настройки' })
  update(
    @Body(zodBody(updateSettingsRequestSchema)) dto: UpdateSettingsRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.settings.update(dto, {
      userId: user.id,
      userEmail: user.email,
      ...AuditService.contextFromRequest(req),
    });
  }
}
