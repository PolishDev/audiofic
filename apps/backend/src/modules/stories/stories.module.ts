import { Module } from '@nestjs/common';
import { StoriesService } from './stories.service.js';
import { StoriesController } from './stories.controller.js';
import { AdminStoriesController } from './admin-stories.controller.js';

@Module({
  controllers: [StoriesController, AdminStoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}
