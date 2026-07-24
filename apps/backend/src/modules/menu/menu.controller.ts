import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  upsertMenuItemRequestSchema,
  reorderMenuRequestSchema,
  type UpsertMenuItemRequest,
  type ReorderMenuRequest,
} from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { MenuService } from './menu.service';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

// Публичное меню отдаётся в составе layout (см. site.controller),
// поэтому здесь только админские операции.
@ApiTags('Меню (админка)')
@ApiBearerAuth()
@Controller('admin/menu')
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  private actor(req: Request, user: AuthUser) {
    return { userId: user.id, userEmail: user.email, ...AuditService.contextFromRequest(req) };
  }

  @Get()
  @ApiOperation({ summary: 'Все пункты меню (плоский список для дерева)' })
  list() {
    return this.menu.adminList();
  }

  @Post()
  @ApiOperation({ summary: 'Создать пункт меню' })
  create(@Body(zodBody(upsertMenuItemRequestSchema)) dto: UpsertMenuItemRequest, @Req() req: Request, @CurrentUser() user: AuthUser) {
    return this.menu.create(dto, this.actor(req, user));
  }

  @Put('reorder')
  @ApiOperation({ summary: 'Перестроить дерево после перетаскивания' })
  async reorder(@Body(zodBody(reorderMenuRequestSchema)) dto: ReorderMenuRequest, @Req() req: Request, @CurrentUser() user: AuthUser) {
    await this.menu.reorder(dto, this.actor(req, user));
    return { ok: true };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Изменить пункт меню' })
  update(@Param('id') id: string, @Body(zodBody(upsertMenuItemRequestSchema)) dto: UpsertMenuItemRequest, @Req() req: Request, @CurrentUser() user: AuthUser) {
    return this.menu.update(id, dto, this.actor(req, user));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить пункт меню (с вложенными)' })
  async remove(@Param('id') id: string, @Req() req: Request, @CurrentUser() user: AuthUser) {
    await this.menu.remove(id, this.actor(req, user));
    return { ok: true };
  }
}
