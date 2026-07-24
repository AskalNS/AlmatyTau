import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { searchQuerySchema, type SearchQuery } from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { parseLocale } from '../../common/i18n.util';
import { SearchService } from './search.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Поиск')
@Controller('public/search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Сквозной поиск по сайту' })
  find(
    @Query(zodBody(searchQuerySchema)) query: SearchQuery,
    @Query('locale') locale?: string,
  ) {
    return this.search.search(query, parseLocale(locale));
  }
}
