import { Module } from '@nestjs/common';
import { PagesService } from './pages.service';
import { PublicPagesController, AdminPagesController } from './pages.controller';

@Module({
  providers: [PagesService],
  controllers: [PublicPagesController, AdminPagesController],
  exports: [PagesService],
})
export class PagesModule {}
