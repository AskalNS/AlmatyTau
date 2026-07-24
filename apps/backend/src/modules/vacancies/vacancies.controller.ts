import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { upsertVacancyRequestSchema, type UpsertVacancyRequest } from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { parseLocale } from '../../common/i18n.util';
import { VacanciesService } from './vacancies.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('Вакансии (публичное)')
@Controller('public/vacancies')
export class PublicVacanciesController {
  constructor(private readonly vacancies: VacanciesService) {}

  @Public()
  @Get()
  list(@Query('locale') locale?: string) {
    return this.vacancies.publicList(parseLocale(locale));
  }

  @Public()
  @Get(':slug')
  get(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.vacancies.publicGet(slug, parseLocale(locale));
  }
}

@ApiTags('Вакансии (админка)')
@ApiBearerAuth()
@Controller('admin/vacancies')
export class AdminVacanciesController {
  constructor(private readonly vacancies: VacanciesService) {}

  private actor(req: Request, user: AuthUser) {
    return { userId: user.id, userEmail: user.email, ...AuditService.contextFromRequest(req) };
  }

  @Get()
  list() {
    return this.vacancies.adminList();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.vacancies.adminGet(id);
  }

  @Post()
  create(@Body(zodBody(upsertVacancyRequestSchema)) dto: UpsertVacancyRequest, @Req() req: Request, @CurrentUser() user: AuthUser) {
    return this.vacancies.create(dto, this.actor(req, user));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body(zodBody(upsertVacancyRequestSchema)) dto: UpsertVacancyRequest, @Req() req: Request, @CurrentUser() user: AuthUser) {
    return this.vacancies.update(id, dto, this.actor(req, user));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request, @CurrentUser() user: AuthUser) {
    await this.vacancies.remove(id, this.actor(req, user));
    return { ok: true };
  }
}
