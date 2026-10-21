import { Module } from '@nestjs/common';
import { PlaybackService } from './playback.service.js';
import { DailyQuotaService } from './daily-quota.service.js';
import { PlaybackController } from './playback.controller.js';

@Module({
  controllers: [PlaybackController],
  providers: [PlaybackService, DailyQuotaService],
  exports: [PlaybackService, DailyQuotaService],
})
export class PlaybackModule {}

