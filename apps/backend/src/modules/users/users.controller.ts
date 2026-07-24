import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  inviteUserRequestSchema,
  updateUserRequestSchema,
  type InviteUserRequest,
  type UpdateUserRequest,
} from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

/**
 * Управление пользователями. Весь контроллер — только для Администратора
 * (п. V ТЗ). Редактор этих роутов не видит и получает 403 при прямом запросе.
 */
@ApiTags('Пользователи')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  private actor(req: Request, user: AuthUser) {
    return {
      userId: user.id,
      userEmail: user.email,
      ...AuditService.contextFromRequest(req),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Список пользователей' })
  list() {
    return this.users.list();
  }

  @Post()
  @ApiOperation({ summary: 'Пригласить пользователя' })
  invite(
    @Body(zodBody(inviteUserRequestSchema)) dto: InviteUserRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.invite(dto, this.actor(req, user));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить пользователя (имя, роль, активность)' })
  update(
    @Param('id') id: string,
    @Body(zodBody(updateUserRequestSchema)) dto: UpdateUserRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.update(id, dto, this.actor(req, user));
  }

  @Post(':id/unlock')
  @ApiOperation({ summary: 'Снять блокировку учётной записи' })
  unlock(
    @Param('id') id: string,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.unlock(id, this.actor(req, user));
  }
}
