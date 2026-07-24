import { Module } from '@nestjs/common';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';
import { MenuModule } from '../menu/menu.module';

/** Зависит от menu (SettingsModule глобальный). */
@Module({
  imports: [MenuModule],
  providers: [SiteService],
  controllers: [SiteController],
})
export class SiteModule {}
