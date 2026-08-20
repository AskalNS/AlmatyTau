import { Module } from '@nestjs/common';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';
import { NewsModule } from '../news/news.module';
import { LinksModule } from '../links/links.module';
import { DocumentsModule } from '../documents/documents.module';

/** Зависит от news и links: главная агрегирует их публичные данные. */
@Module({
  imports: [NewsModule, LinksModule, DocumentsModule],
  providers: [HomeService],
  controllers: [HomeController],
})
export class HomeModule {}
