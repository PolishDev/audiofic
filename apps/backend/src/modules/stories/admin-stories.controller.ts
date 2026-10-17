import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard.js';
import { StoriesService } from './stories.service.js';
import {
  createStorySchema,
  updateStorySchema,
  createEpisodeSchema,
  updateEpisodeSchema,
  bulkImportStorySchema,
} from './dto/story.dto.js';

@Controller('admin')
@UseGuards(AdminKeyGuard)
export class AdminStoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  /**
   * Create a new story.
   * POST /admin/stories
   */
  @Post('stories')
  async createStory(@Body() body: unknown) {
    const parsed = createStorySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dados inválidos para criação da história',
        errors: parsed.error.format(),
      });
    }
    return this.storiesService.createStory(parsed.data);
  }

  /**
   * Update an existing story.
   * PUT /admin/stories/:id
   */
  @Put('stories/:id')
  async updateStory(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateStorySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dados inválidos para atualização da história',
        errors: parsed.error.format(),
      });
    }
    return this.storiesService.updateStory(id, parsed.data);
  }

  /**
   * Delete a story and its cascade dependencies.
   * DELETE /admin/stories/:id
   */
  @Delete('stories/:id')
  async deleteStory(@Param('id') id: string) {
    return this.storiesService.deleteStory(id);
  }

  /**
   * Add a single episode to a story.
   * POST /admin/stories/:id/episodes
   */
  @Post('stories/:id/episodes')
  async addEpisode(@Param('id') storyId: string, @Body() body: unknown) {
    const parsed = createEpisodeSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dados inválidos para o episódio',
        errors: parsed.error.format(),
      });
    }
    return this.storiesService.addEpisode(storyId, parsed.data);
  }

  /**
   * Update an episode.
   * PUT /admin/episodes/:id
   */
  @Put('episodes/:id')
  async updateEpisode(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateEpisodeSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dados inválidos para atualização do episódio',
        errors: parsed.error.format(),
      });
    }
    return this.storiesService.updateEpisode(id, parsed.data);
  }

  /**
   * Delete an episode.
   * DELETE /admin/episodes/:id
   */
  @Delete('episodes/:id')
  async deleteEpisode(@Param('id') id: string) {
    return this.storiesService.deleteEpisode(id);
  }

  /**
   * Bulk import an entire story with episodes and genres at once.
   * Specifically crafted for local AI generators and ingestion automation.
   * POST /admin/stories/bulk-import
   */
  @Post('stories/bulk-import')
  async bulkImport(@Body() body: unknown) {
    const parsed = bulkImportStorySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Payload inválido para importação em lote',
        errors: parsed.error.format(),
      });
    }
    return this.storiesService.importBulkStory(parsed.data);
  }
}
