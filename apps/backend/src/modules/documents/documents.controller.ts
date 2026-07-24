import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  upsertDocumentRequestSchema,
  documentQuerySchema,
  type UpsertDocumentRequest,
  type DocumentQuery,
} from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { parseLocale } from '../../common/i18n.util';
import { DocumentsService } from './documents.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('Документы (публичное)')
@Controller('public/documents')
export class PublicDocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Категории документов' })
  categories() {
    return this.docs.listCategories();
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Список документов' })
  list(@Query(zodBody(documentQuerySchema)) query: DocumentQuery, @Query('locale') locale?: string) {
    return this.docs.publicList(query, parseLocale(locale));
  }

  @Public()
  @Get(':id/download')
  @ApiOperation({ summary: 'Скачать документ (редирект на подписанную ссылку)' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const url = await this.docs.downloadUrl(id);
    // 302 на короткоживущую подписанную ссылку: сам файл лежит в private/.
    res.redirect(302, url);
  }
}

@ApiTags('Документы (админка)')
@ApiBearerAuth()
@Controller('admin/documents')
export class AdminDocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  private actor(req: Request, user: AuthUser) {
    return { userId: user.id, userEmail: user.email, ...AuditService.contextFromRequest(req) };
  }

  @Get('categories')
  categories() {
    return this.docs.listCategories();
  }

  @Get()
  list(@Query(zodBody(documentQuerySchema)) query: DocumentQuery) {
    return this.docs.adminList(query);
  }

  @Post()
  create(
    @Body(zodBody(upsertDocumentRequestSchema)) dto: UpsertDocumentRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.docs.create(dto, this.actor(req, user));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(zodBody(upsertDocumentRequestSchema)) dto: UpsertDocumentRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.docs.update(id, dto, this.actor(req, user));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request, @CurrentUser() user: AuthUser) {
    await this.docs.remove(id, this.actor(req, user));
    return { ok: true };
  }
}
