import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { feedbackRequestSchema, type FeedbackRequest } from '@atm/contracts';
import { zodBody } from '../../common/zod-validation.pipe';
import { FeedbackService } from './feedback.service';
import { Public } from '../auth/decorators/public.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('Обратная связь (публичное)')
@Controller('public/feedback')
export class PublicFeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  // Не более 3 обращений в минуту с адреса — защита от спама формы.
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post()
  @ApiOperation({ summary: 'Отправить обращение' })
  async submit(@Body(zodBody(feedbackRequestSchema)) dto: FeedbackRequest, @Req() req: Request) {
    await this.feedback.submit(dto, AuditService.contextFromRequest(req));
    return { ok: true };
  }
}

@ApiTags('Обратная связь (админка)')
@ApiBearerAuth()
@Controller('admin/feedback')
export class AdminFeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Get()
  @ApiOperation({ summary: 'Список обращений' })
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.feedback.list(page ? Number(page) : 1, limit ? Number(limit) : 30);
  }

  @Post(':id/processed')
  @ApiOperation({ summary: 'Отметить обращение обработанным' })
  async markProcessed(@Param('id') id: string) {
    await this.feedback.markProcessed(id);
    return { ok: true };
  }
}
