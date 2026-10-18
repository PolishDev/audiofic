import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../db/index.js';
import { userProgress } from '../../db/schemas/user-progress.table.js';
import { episode } from '../../db/schemas/episode.table.js';
import type { UpdateProgressDto } from './dto/playback.dto.js';

@Injectable()
export class PlaybackService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * Save playback progress for an episode.
   */
  async saveProgress(userId: string, dto: UpdateProgressDto) {
    const targetEpisode = await this.db.query.episode.findFirst({
      where: eq(episode.id, dto.episodeId),
    });

    if (!targetEpisode) {
      throw new NotFoundException('Episódio não encontrado');
    }

    const pos = Math.floor(Math.max(0, dto.positionSeconds));
    const isCompleted =
      dto.isCompleted === true ||
      (targetEpisode.durationSeconds > 0 &&
        pos >= targetEpisode.durationSeconds - 5);

    const updateDate = dto.updatedAt ? new Date(dto.updatedAt) : new Date();

    const [saved] = await this.db
      .insert(userProgress)
      .values({
        userId,
        episodeId: dto.episodeId,
        positionSeconds: pos,
        isCompleted,
        updatedAt: updateDate,
      })
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.episodeId],
        set: {
          positionSeconds: pos,
          isCompleted,
          updatedAt: updateDate,
        },
      })
      .returning();

    return {
      success: true,
      progress: saved,
    };
  }

  /**
   * Batch synchronize offline playback progress when connection is restored.
   */
  async syncBatch(userId: string, items: UpdateProgressDto[]) {
    if (!items || items.length === 0) {
      return { success: true, count: 0 };
    }

    let syncedCount = 0;
    for (const item of items) {
      try {
        await this.saveProgress(userId, item);
        syncedCount++;
      } catch (err) {
        // Continue processing others
      }
    }

    return {
      success: true,
      count: syncedCount,
    };
  }

  /**
   * Retrieve saved playback progress for a specific episode.
   */
  async getEpisodeProgress(userId: string, episodeId: string) {
    const item = await this.db.query.userProgress.findFirst({
      where: and(
        eq(userProgress.userId, userId),
        eq(userProgress.episodeId, episodeId),
      ),
    });

    return { progress: item ?? null };
  }

  /**
   * Retrieve the most recent episode being listened to ("Retomar").
   */
  async getResume(userId: string) {
    const latest = await this.db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      orderBy: [desc(userProgress.updatedAt)],
      with: {
        episode: {
          with: {
            story: true,
          },
        },
      },
    });

    if (!latest) {
      return { resume: null };
    }

    return {
      resume: {
        id: latest.id,
        positionSeconds: latest.positionSeconds,
        isCompleted: latest.isCompleted,
        updatedAt: latest.updatedAt,
        episode: latest.episode,
        story: latest.episode?.story ?? null,
      },
    };
  }

  /**
   * List in-progress episodes for the "Continuar Ouvindo" carousel.
   */
  async getContinueListening(userId: string, limit = 10) {
    const items = await this.db.query.userProgress.findMany({
      where: and(
        eq(userProgress.userId, userId),
        eq(userProgress.isCompleted, false),
      ),
      orderBy: [desc(userProgress.updatedAt)],
      limit: Math.min(20, Math.max(1, limit)),
      with: {
        episode: {
          with: {
            story: true,
          },
        },
      },
    });

    return items
      .filter((item) => item.episode && item.episode.story)
      .map((item) => ({
        id: item.id,
        positionSeconds: item.positionSeconds,
        isCompleted: item.isCompleted,
        updatedAt: item.updatedAt,
        episode: item.episode,
        story: item.episode.story,
      }));
  }
}
