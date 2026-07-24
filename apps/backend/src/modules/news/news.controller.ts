import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  upsertNewsRequestSchema,
  newsQuerySchema,
  type UpsertNewsRequest,
  type NewsQuery,
} from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { parseLocale } from '../../common/i18n.util';
import { NewsService } from './news.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

/* ----------------------------- Публичное ----------------------------- */

@ApiTags('Новости (публичное)')
@Controller('public/news')
export class PublicNewsController {
  constructor(private readonly news: NewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Лента новостей' })
  list(
    @Query(zodBody(newsQuerySchema)) query: NewsQuery,
    @Query('locale') locale?: string,
  ) {
    return this.news.publicList(query, parseLocale(locale));
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Новость по адресу' })
  get(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.news.publicGet(slug, parseLocale(locale));
  }
}

/* ------------------------------ Админка ------------------------------ */

@ApiTags('Новости (админка)')
@ApiBearerAuth()
@Controller('admin/news')
export class AdminNewsController {
  constructor(private readonly news: NewsService) {}

  private actor(req: Request, user: AuthUser) {
    return { userId: user.id, userEmail: user.email, ...AuditService.contextFromRequest(req) };
  }

  @Get()
  @ApiOperation({ summary: 'Список новостей' })
  list(@Query(zodBody(newsQuerySchema)) query: NewsQuery) {
    return this.news.adminList(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Новость для редактирования' })
  get(@Param('id') id: string) {
    return this.news.adminGet(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать новость' })
  create(
    @Body(zodBody(upsertNewsRequestSchema)) dto: UpsertNewsRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.news.create(dto, this.actor(req, user));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Сохранить новость' })
  update(
    @Param('id') id: string,
    @Body(zodBody(upsertNewsRequestSchema)) dto: UpsertNewsRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.news.update(id, dto, this.actor(req, user));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить новость' })
  async remove(@Param('id') id: string, @Req() req: Request, @CurrentUser() user: AuthUser) {
    await this.news.remove(id, this.actor(req, user));
    return { ok: true };
  }
}
