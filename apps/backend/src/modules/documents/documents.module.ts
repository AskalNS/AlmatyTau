import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PublicDocumentsController, AdminDocumentsController } from './documents.controller';

@Module({
  providers: [DocumentsService],
  controllers: [PublicDocumentsController, AdminDocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
