import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { upsertLinkRequestSchema, linkGroupSchema, type UpsertLinkRequest } from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { parseLocale } from '../../common/i18n.util';
import { LinksService } from './links.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('Ссылки (публичное)')
@Controller('public/links')
export class PublicLinksController {
  constructor(private readonly links: LinksService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Внешние ссылки, опционально ?group=GOVERNMENT' })
  list(@Query('locale') locale?: string, @Query('group') group?: string) {
    return this.links.publicList(parseLocale(locale), group ? linkGroupSchema.parse(group) : undefined);
  }
}

@ApiTags('Ссылки (админка)')
@ApiBearerAuth()
@Controller('admin/links')
export class AdminLinksController {
  constructor(private readonly links: LinksService) {}

  private actor(req: Request, user: AuthUser) {
    return { userId: user.id, userEmail: user.email, ...AuditService.contextFromRequest(req) };
  }

  @Get()
  list() {
    return this.links.adminList();
  }

  @Post()
  create(@Body(zodBody(upsertLinkRequestSchema)) dto: UpsertLinkRequest, @Req() req: Request, @CurrentUser() user: AuthUser) {
    return this.links.create(dto, this.actor(req, user));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body(zodBody(upsertLinkRequestSchema)) dto: UpsertLinkRequest, @Req() req: Request, @CurrentUser() user: AuthUser) {
    return this.links.update(id, dto, this.actor(req, user));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request, @CurrentUser() user: AuthUser) {
    await this.links.remove(id, this.actor(req, user));
    return { ok: true };
  }
}
