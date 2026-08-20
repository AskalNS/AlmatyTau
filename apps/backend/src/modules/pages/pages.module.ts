import { Module } from '@nestjs/common';
import { PagesService } from './pages.service';
import { PublicPagesController, AdminPagesController } from './pages.controller';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  providers: [PagesService],
  controllers: [PublicPagesController, AdminPagesController],
  exports: [PagesService],
})
export class PagesModule {}
