import { Module } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { PublicAlbumsController, AdminAlbumsController } from './albums.controller';

// MediaMapper приходит из глобального MediaModule — импортировать его здесь
// не нужно и нельзя: это создало бы циклическую зависимость модулей.
@Module({
  providers: [AlbumsService],
  controllers: [PublicAlbumsController, AdminAlbumsController],
})
export class AlbumsModule {}
