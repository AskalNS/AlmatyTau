import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

/**
 * Глобальный: писать в журнал нужно из auth, media и всех контентных
 * модулей, поэтому AuditService должен быть доступен без явного импорта.
 */
@Global()
@Module({
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
