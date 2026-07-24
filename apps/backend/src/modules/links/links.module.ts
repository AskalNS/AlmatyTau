import { Module } from '@nestjs/common';
import { LinksService } from './links.service';
import { PublicLinksController, AdminLinksController } from './links.controller';

@Module({
  providers: [LinksService],
  controllers: [PublicLinksController, AdminLinksController],
  exports: [LinksService],
})
export class LinksModule {}
