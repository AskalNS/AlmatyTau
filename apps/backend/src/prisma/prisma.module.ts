import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Глобальный: PrismaService нужен почти в каждом модуле, а импортировать
 * PrismaModule в каждый из полутора десятков модулей — лишний шум.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
