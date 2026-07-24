import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ImageProcessorService } from './image-processor.service';
import { MediaMapper } from './media.mapper';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';

/**
 * Глобальный: MediaMapper и StorageService нужны почти всем контентным
 * модулям для разрешения обложек и вложений в URL.
 */
@Global()
@Module({
  providers: [StorageService, ImageProcessorService, MediaMapper, MediaService],
  controllers: [MediaController],
  exports: [StorageService, MediaMapper, MediaService],
})
export class MediaModule {}
