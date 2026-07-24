import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { parseLocale } from '../../common/i18n.util';
import { SiteService } from './site.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Каркас сайта')
@Controller('public')
export class SiteController {
  constructor(private readonly site: SiteService) {}

  @Public()
  @Get('layout')
  @ApiOperation({ summary: 'Меню, настройки и языки одним запросом' })
  layout(@Query('locale') locale?: string) {
    return this.site.layout(parseLocale(locale));
  }

  @Public()
  @Get('sitemap')
  @ApiOperation({ summary: 'Данные для sitemap.xml' })
  sitemap() {
    return this.site.sitemap();
  }
}
