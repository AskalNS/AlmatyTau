import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { upsertPageRequestSchema, type UpsertPageRequest } from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { parseLocale } from '../../common/i18n.util';
import { PagesService } from './pages.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('Страницы (публичное)')
@Controller('public/pages')
export class PublicPagesController {
  constructor(private readonly pages: PagesService) {}

  // Путь может содержать слеши (company/about). На Express 4 wildcard —
  // это '*', а весь захваченный хвост лежит в params[0].
  @Public()
  @Get('*')
  @ApiOperation({ summary: 'Страница по адресу' })
  get(@Req() req: Request, @Query('locale') locale?: string) {
    const full = (req.params as Record<string, string>)['0'] ?? '';
    if (!full) throw new BadRequestException('Не указан адрес страницы');
    return this.pages.publicGet(full.replace(/^\/+|\/+$/g, ''), parseLocale(locale));
  }
}

@ApiTags('Страницы (админка)')
@ApiBearerAuth()
@Controller('admin/pages')
export class AdminPagesController {
  constructor(private readonly pages: PagesService) {}

  private actor(req: Request, user: AuthUser) {
    return { userId: user.id, userEmail: user.email, ...AuditService.contextFromRequest(req) };
  }

  @Get()
  @ApiOperation({ summary: 'Список страниц' })
  list() {
    return this.pages.adminList();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Страница для редактирования' })
  get(@Param('id') id: string) {
    return this.pages.adminGet(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать страницу' })
  create(
    @Body(zodBody(upsertPageRequestSchema)) dto: UpsertPageRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pages.create(dto, this.actor(req, user));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Сохранить страницу' })
  update(
    @Param('id') id: string,
    @Body(zodBody(upsertPageRequestSchema)) dto: UpsertPageRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pages.update(id, dto, this.actor(req, user));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить страницу' })
  async remove(@Param('id') id: string, @Req() req: Request, @CurrentUser() user: AuthUser) {
    await this.pages.remove(id, this.actor(req, user));
    return { ok: true };
  }
}
