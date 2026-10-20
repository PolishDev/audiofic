import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../db/index.js';
import { userFavorites } from '../../db/schemas/user-favorites.table.js';
import { story } from '../../db/schemas/story.table.js';
import { episode } from '../../db/schemas/episode.table.js';

@Injectable()
export class FavoritesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * List all favorited stories for a user, ordered by most recently favorited.
   */
  async listFavorites(userId: string) {
    const favorites = await this.db.query.userFavorites.findMany({
      where: eq(userFavorites.userId, userId),
      orderBy: [desc(userFavorites.createdAt)],
      with: {
        story: {
          with: {
            genres: {
              with: {
                genre: true,
              },
            },
            episodes: {
              where: eq(episode.status, 'published'),
              columns: {
                id: true,
                episodeNumber: true,
                seasonNumber: true,
                durationSeconds: true,
                isPremium: true,
              },
            },
          },
        },
      },
    });

    return favorites
      .filter((fav) => fav.story && fav.story.status === 'published')
      .map((fav) => ({
        id: fav.id,
        favoritedAt: fav.createdAt,
        story: {
          ...fav.story,
          genres: fav.story.genres.map((g) => g.genre),
          episodesCount: fav.story.episodes.length,
        },
      }));
  }

  /**
   * Check if a story is favorited by the user.
   */
  async isFavorite(userId: string, storyId: string): Promise<boolean> {
    const item = await this.db.query.userFavorites.findFirst({
      where: and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.storyId, storyId),
      ),
    });

    return !!item;
  }

  /**
   * Add a story to the user's favorites list.
   */
  async addFavorite(userId: string, storyId: string) {
    const targetStory = await this.db.query.story.findFirst({
      where: eq(story.id, storyId),
    });

    if (!targetStory) {
      throw new NotFoundException('História não encontrada');
    }

    await this.db
      .insert(userFavorites)
      .values({
        userId,
        storyId,
      })
      .onConflictDoNothing({
        target: [userFavorites.userId, userFavorites.storyId],
      });

    return {
      success: true,
      isFavorite: true,
      message: 'História adicionada à Minha Lista',
    };
  }

  /**
   * Remove a story from the user's favorites list.
   */
  async removeFavorite(userId: string, storyId: string) {
    await this.db
      .delete(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.storyId, storyId),
        ),
      );

    return {
      success: true,
      isFavorite: false,
      message: 'História removida da Minha Lista',
    };
  }

  /**
   * Toggle favorite state for a story.
   */
  async toggleFavorite(userId: string, storyId: string) {
    const exists = await this.isFavorite(userId, storyId);

    if (exists) {
      return this.removeFavorite(userId, storyId);
    } else {
      return this.addFavorite(userId, storyId);
    }
  }
}
