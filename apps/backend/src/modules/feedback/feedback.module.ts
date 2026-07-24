import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { PublicFeedbackController, AdminFeedbackController } from './feedback.controller';

@Module({
  providers: [FeedbackService],
  controllers: [PublicFeedbackController, AdminFeedbackController],
})
export class FeedbackModule {}
