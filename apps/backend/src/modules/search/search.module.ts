import { Global, Module } from '@nestjs/common';
import { SearchIndexerService } from './search-indexer.service';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

/**
 * Глобальный: SearchIndexerService вызывается из всех контентных модулей
 * при публикации, чтобы держать индекс в актуальном состоянии.
 */
@Global()
@Module({
  providers: [SearchIndexerService, SearchService],
  controllers: [SearchController],
  exports: [SearchIndexerService],
})
export class SearchModule {}
