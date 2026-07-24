import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  upsertPersonRequestSchema,
  personBoardSchema,
  type UpsertPersonRequest,
} from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { parseLocale } from '../../common/i18n.util';
import { PersonsService } from './persons.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('Персоны (публичное)')
@Controller('public/persons')
export class PublicPersonsController {
  constructor(private readonly persons: PersonsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Список членов совета: ?board=MANAGEMENT|SUPERVISORY' })
  list(@Query('board') board?: string, @Query('locale') locale?: string) {
    return this.persons.publicList(personBoardSchema.parse(board ?? 'MANAGEMENT'), parseLocale(locale));
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Персона по адресу' })
  get(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.persons.publicGet(slug, parseLocale(locale));
  }
}

@ApiTags('Персоны (админка)')
@ApiBearerAuth()
@Controller('admin/persons')
export class AdminPersonsController {
  constructor(private readonly persons: PersonsService) {}

  private actor(req: Request, user: AuthUser) {
    return { userId: user.id, userEmail: user.email, ...AuditService.contextFromRequest(req) };
  }

  @Get()
  list() {
    return this.persons.adminList();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.persons.adminGet(id);
  }

  @Post()
  create(
    @Body(zodBody(upsertPersonRequestSchema)) dto: UpsertPersonRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.persons.create(dto, this.actor(req, user));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(zodBody(upsertPersonRequestSchema)) dto: UpsertPersonRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.persons.update(id, dto, this.actor(req, user));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request, @CurrentUser() user: AuthUser) {
    await this.persons.remove(id, this.actor(req, user));
    return { ok: true };
  }
}
