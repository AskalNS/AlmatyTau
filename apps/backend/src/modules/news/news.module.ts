import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { PublicNewsController, AdminNewsController } from './news.controller';

@Module({
  providers: [NewsService],
  controllers: [PublicNewsController, AdminNewsController],
  exports: [NewsService],
})
export class NewsModule {}
