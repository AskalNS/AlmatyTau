import { Module } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { PublicPersonsController, AdminPersonsController } from './persons.controller';

@Module({
  providers: [PersonsService],
  controllers: [PublicPersonsController, AdminPersonsController],
})
export class PersonsModule {}
