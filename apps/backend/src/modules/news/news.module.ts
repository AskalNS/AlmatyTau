import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { PublicNewsController, AdminNewsController } from './news.controller';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  providers: [NewsService],
  controllers: [PublicNewsController, AdminNewsController],
  exports: [NewsService],
})
export class NewsModule {}
