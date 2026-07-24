import { Global, Module } from '@nestjs/common';
import { SanitizerService } from './sanitizer.service';

/** Мелкие переиспользуемые сервисы без собственного домена. */
@Global()
@Module({
  providers: [SanitizerService],
  exports: [SanitizerService],
})
export class CommonModule {}
