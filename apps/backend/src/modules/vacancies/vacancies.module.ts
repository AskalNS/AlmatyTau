import { Module } from '@nestjs/common';
import { VacanciesService } from './vacancies.service';
import { PublicVacanciesController, AdminVacanciesController } from './vacancies.controller';

@Module({
  providers: [VacanciesService],
  controllers: [PublicVacanciesController, AdminVacanciesController],
})
export class VacanciesModule {}
