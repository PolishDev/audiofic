import { Module } from '@nestjs/common';
import { PlaybackService } from './playback.service.js';
import { PlaybackController } from './playback.controller.js';

@Module({
  controllers: [PlaybackController],
  providers: [PlaybackService],
  exports: [PlaybackService],
})
export class PlaybackModule {}
