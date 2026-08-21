import { Body, Controller, Get, Param, Put, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { updateHomeSectionRequestSchema, type UpdateHomeSectionRequest } from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { parseLocale } from '../../common/i18n.util';
import { HomeService } from './home.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('Главная страница')
@Controller('public/home')
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Данные главной страницы' })
  get(@Query('locale') locale?: string) {
    return this.home.publicHome(parseLocale(locale));
  }
}

@ApiTags('Главная страница (админка)')
@ApiBearerAuth()
@Controller('admin/home')
export class AdminHomeController {
  constructor(private readonly home: HomeService) {}

  @Get()
  @ApiOperation({ summary: 'Секции главной страницы' })
  list() {
    return this.home.adminList();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Сохранить секцию главной страницы' })
  update(
    @Param('id') id: string,
    @Body(zodBody(updateHomeSectionRequestSchema)) dto: UpdateHomeSectionRequest,
    @Req() req: Request,
    @CurrentUser() user: AuthUser,
  ) {
    return this.home.update(id, dto, {
      userId: user.id,
      userEmail: user.email,
      ...AuditService.contextFromRequest(req),
    });
  }
}
