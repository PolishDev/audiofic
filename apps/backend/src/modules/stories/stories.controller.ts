import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StoriesService } from './stories.service.js';
import type { StoryQueryParams } from './dto/story.dto.js';

@Controller()
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  /**
   * List stories with filters, search, and sorting (trending, popular, recent).
   * GET /stories?genre=terror-sobrenatural&sort=trending&page=1&limit=20
   */
  @Get('stories')
  async getAllStories(@Query() query: StoryQueryParams) {
    return this.storiesService.findAll(query);
  }

  /**
   * Top trending stories ("Em Alta").
   * GET /stories/trending?limit=10
   */
  @Get('stories/trending')
  async getTrendingStories(@Query('limit') limit?: number) {
    return this.storiesService.findTrending(limit ? Number(limit) : 10);
  }

  /**
   * Curated featured stories ("Destaques").
   * GET /stories/featured?limit=5
   */
  @Get('stories/featured')
  async getFeaturedStories(@Query('limit') limit?: number) {
    return this.storiesService.findFeatured(limit ? Number(limit) : 5);
  }

  /**
   * Story details with complete episode list.
   * GET /stories/:idOrSlug
   */
  @Get('stories/:idOrSlug')
  async getStoryByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    return this.storiesService.findByIdOrSlug(idOrSlug);
  }

  /**
   * Telemetry: Record story view/click and refresh trending score.
   * POST /stories/:id/view
   */
  @Post('stories/:id/view')
  @HttpCode(HttpStatus.OK)
  async recordStoryView(@Param('id') id: string) {
    return this.storiesService.recordView(id);
  }

  /**
   * Telemetry: Record episode audio play and refresh story trending score.
   * POST /episodes/:id/play
   */
  @Post('episodes/:id/play')
  @HttpCode(HttpStatus.OK)
  async recordEpisodePlay(@Param('id') id: string) {
    return this.storiesService.recordPlay(id);
  }
}
