import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { upsertAlbumRequestSchema, type UpsertAlbumRequest } from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { parseLocale } from '../../common/i18n.util';
import { AlbumsService } from './albums.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('Медиагалерея (публичное)')
@Controller('public/albums')
export class PublicAlbumsController {
  constructor(private readonly albums: AlbumsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Список опубликованных альбомов' })
  list(@Query('locale') locale?: string) {
    return this.albums.publicList(parseLocale(locale));
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Альбом с составом файлов' })
  get(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.albums.publicGet(slug, parseLocale(locale));
  }
}

@ApiTags('Медиагалерея (админка)')
@ApiBearerAuth()
@Controller('admin/albums')
export class AdminAlbumsController {
  constructor(private readonly albums: AlbumsService) {}

  private actor(req: Request, user: AuthUser) {
    return { userId: user.id, userEmail: user.email, ...AuditService.contextFromRequest(req) };
  }

  @Get()
  list() {
    return this.albums.adminList();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.albums.adminGet(id);
  }

  @Post()
  create(
    @Body(zodBody(upsertAlbumRequestSchema)) dto: UpsertAlbumRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.albums.create(dto, this.actor(req, user));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(zodBody(upsertAlbumRequestSchema)) dto: UpsertAlbumRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.albums.update(id, dto, this.actor(req, user));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request, @CurrentUser() user: AuthUser) {
    return this.albums.remove(id, this.actor(req, user));
  }
}
