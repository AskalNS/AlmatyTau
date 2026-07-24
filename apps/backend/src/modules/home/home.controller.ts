import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { parseLocale } from '../../common/i18n.util';
import { HomeService } from './home.service';
import { Public } from '../auth/decorators/public.decorator';

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
