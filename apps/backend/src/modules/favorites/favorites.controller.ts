import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { FavoritesService } from './favorites.service.js';
import type { User } from '../../db/schemas/user.table.js';

@Controller('favorites')
@UseGuards(AuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  /**
   * Get all favorited stories for current authenticated user.
   * GET /favorites
   */
  @Get()
  async getMyFavorites(@CurrentUser() currentUser: User) {
    return this.favoritesService.listFavorites(currentUser.id);
  }

  /**
   * Check if a specific story is favorited by current user.
   * GET /favorites/:storyId/status
   */
  @Get(':storyId/status')
  async checkFavoriteStatus(
    @CurrentUser() currentUser: User,
    @Param('storyId') storyId: string,
  ) {
    const isFav = await this.favoritesService.isFavorite(
      currentUser.id,
      storyId,
    );
    return { isFavorite: isFav };
  }

  /**
   * Add a story to favorites.
   * POST /favorites/:storyId
   */
  @Post(':storyId')
  @HttpCode(HttpStatus.OK)
  async addFavorite(
    @CurrentUser() currentUser: User,
    @Param('storyId') storyId: string,
  ) {
    return this.favoritesService.addFavorite(currentUser.id, storyId);
  }

  /**
   * Remove a story from favorites.
   * DELETE /favorites/:storyId
   */
  @Delete(':storyId')
  @HttpCode(HttpStatus.OK)
  async removeFavorite(
    @CurrentUser() currentUser: User,
    @Param('storyId') storyId: string,
  ) {
    return this.favoritesService.removeFavorite(currentUser.id, storyId);
  }

  /**
   * Toggle favorite state for a story.
   * POST /favorites/:storyId/toggle
   */
  @Post(':storyId/toggle')
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(
    @CurrentUser() currentUser: User,
    @Param('storyId') storyId: string,
  ) {
    return this.favoritesService.toggleFavorite(currentUser.id, storyId);
  }
}
