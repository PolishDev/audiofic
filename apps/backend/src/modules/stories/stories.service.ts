import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../db/index.js';
import {
  story,
  type Story,
} from '../../db/schemas/story.table.js';
import {
  episode,
  type Episode,
} from '../../db/schemas/episode.table.js';
import {
  genre,
} from '../../db/schemas/genre.table.js';
import {
  storyGenre,
} from '../../db/schemas/story-genre.table.js';
import {
  storyMetricEvent,
} from '../../db/schemas/story-metric-event.table.js';
import { slugify } from '../../common/utils/slugify.js';
import type {
  CreateStoryDto,
  UpdateStoryDto,
  CreateEpisodeDto,
  UpdateEpisodeDto,
  BulkImportStoryDto,
  StoryQueryParams,
} from './dto/story.dto.js';

export function calculateTrendingScore(
  viewsCount: number,
  playsCount: number,
  createdAt: Date,
): number {
  const hoursSinceCreation = Math.max(
    0,
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60),
  );
  const rawScore = viewsCount * 1.0 + playsCount * 3.0;
  const gravity = 1.4;
  return Number((rawScore / Math.pow(hoursSinceCreation + 2, gravity)).toFixed(4));
}

@Injectable()
export class StoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * List stories for catalog with pagination, filters and sorting.
   */
  async findAll(params: StoryQueryParams = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];

    // Filter by status (default to 'published' for catalog)
    if (params.status) {
      conditions.push(eq(story.status, params.status));
    } else {
      conditions.push(eq(story.status, 'published'));
    }

    // Filter by search query
    if (params.search) {
      const searchTerm = `%${params.search.trim()}%`;
      conditions.push(
        sql`(${ilike(story.title, searchTerm)} OR ${ilike(story.synopsis, searchTerm)})`,
      );
    }

    // Filter by genre
    if (params.genre) {
      const targetGenre = await this.db.query.genre.findFirst({
        where: sql`(${eq(genre.slug, params.genre)} OR ${eq(genre.id, params.genre)})`,
      });

      if (targetGenre) {
        const storiesWithGenre = await this.db
          .select({ storyId: storyGenre.storyId })
          .from(storyGenre)
          .where(eq(storyGenre.genreId, targetGenre.id));

        const storyIds = storiesWithGenre.map((s) => s.storyId);
        if (storyIds.length === 0) {
          return { data: [], total: 0, page, limit };
        }
        conditions.push(inArray(story.id, storyIds));
      } else {
        return { data: [], total: 0, page, limit };
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sorting
    let orderByClause;
    if (params.sort === 'popular') {
      orderByClause = [desc(story.playsCount), desc(story.viewsCount)];
    } else if (params.sort === 'recent') {
      orderByClause = [desc(story.createdAt)];
    } else {
      // Default: trending
      orderByClause = [desc(story.trendingScore), desc(story.lastActivityAt)];
    }

    const items = await this.db.query.story.findMany({
      where: whereClause,
      orderBy: orderByClause,
      limit,
      offset,
      with: {
        genres: {
          with: {
            genre: true,
          },
        },
        episodes: {
          columns: {
            id: true,
            episodeNumber: true,
            seasonNumber: true,
            durationSeconds: true,
            isPremium: true,
          },
        },
      },
    });

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(story)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const formatted = items.map((s) => ({
      ...s,
      genres: s.genres.map((g) => g.genre),
      episodesCount: s.episodes.length,
    }));

    return {
      data: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns top trending stories ("Em Alta").
   */
  async findTrending(limit = 10) {
    const items = await this.db.query.story.findMany({
      where: eq(story.status, 'published'),
      orderBy: [desc(story.trendingScore), desc(story.lastActivityAt)],
      limit: Math.min(20, Math.max(1, limit)),
      with: {
        genres: {
          with: {
            genre: true,
          },
        },
        episodes: {
          columns: {
            id: true,
            episodeNumber: true,
            durationSeconds: true,
            isPremium: true,
          },
        },
      },
    });

    return items.map((s) => ({
      ...s,
      genres: s.genres.map((g) => g.genre),
      episodesCount: s.episodes.length,
    }));
  }

  /**
   * Returns editorial featured stories ("Destaques").
   */
  async findFeatured(limit = 5) {
    const items = await this.db.query.story.findMany({
      where: and(eq(story.status, 'published'), eq(story.isFeatured, true)),
      orderBy: [desc(story.trendingScore), desc(story.updatedAt)],
      limit: Math.min(10, Math.max(1, limit)),
      with: {
        genres: {
          with: {
            genre: true,
          },
        },
        episodes: {
          columns: {
            id: true,
            episodeNumber: true,
            durationSeconds: true,
            isPremium: true,
          },
        },
      },
    });

    return items.map((s) => ({
      ...s,
      genres: s.genres.map((g) => g.genre),
      episodesCount: s.episodes.length,
    }));
  }

  /**
   * Get single story by ID or unique slug, including full episode list.
   */
  async findByIdOrSlug(idOrSlug: string) {
    const found = await this.db.query.story.findFirst({
      where: sql`(${eq(story.id, idOrSlug)} OR ${eq(story.slug, idOrSlug)})`,
      with: {
        genres: {
          with: {
            genre: true,
          },
        },
        episodes: {
          orderBy: [sql`${episode.seasonNumber} ASC`, sql`${episode.episodeNumber} ASC`],
        },
      },
    });

    if (!found) {
      throw new NotFoundException('História não encontrada');
    }

    return {
      ...found,
      genres: found.genres.map((g) => g.genre),
    };
  }

  /**
   * Record a view event and recalculate trending score.
   */
  async recordView(storyId: string) {
    const targetStory = await this.db.query.story.findFirst({
      where: eq(story.id, storyId),
    });

    if (!targetStory) {
      throw new NotFoundException('História não encontrada');
    }

    const newViews = targetStory.viewsCount + 1;
    const newScore = calculateTrendingScore(
      newViews,
      targetStory.playsCount,
      targetStory.createdAt,
    );

    await this.db
      .update(story)
      .set({
        viewsCount: newViews,
        trendingScore: newScore,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(story.id, storyId));

    await this.db.insert(storyMetricEvent).values({
      storyId,
      eventType: 'view',
    });

    return {
      success: true,
      viewsCount: newViews,
      trendingScore: newScore,
    };
  }

  /**
   * Record an episode play event and recalculate story trending score.
   */
  async recordPlay(episodeId: string) {
    const targetEpisode = await this.db.query.episode.findFirst({
      where: eq(episode.id, episodeId),
    });

    if (!targetEpisode) {
      throw new NotFoundException('Episódio não encontrado');
    }

    const targetStory = await this.db.query.story.findFirst({
      where: eq(story.id, targetEpisode.storyId),
    });

    if (!targetStory) {
      throw new NotFoundException('História associada não encontrada');
    }

    const newEpisodePlays = targetEpisode.playsCount + 1;
    const newStoryPlays = targetStory.playsCount + 1;
    const newScore = calculateTrendingScore(
      targetStory.viewsCount,
      newStoryPlays,
      targetStory.createdAt,
    );

    // Update episode play count
    await this.db
      .update(episode)
      .set({
        playsCount: newEpisodePlays,
        updatedAt: new Date(),
      })
      .where(eq(episode.id, episodeId));

    // Update story play count, trending score and activity
    await this.db
      .update(story)
      .set({
        playsCount: newStoryPlays,
        trendingScore: newScore,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(story.id, targetStory.id));

    // Record metric event
    await this.db.insert(storyMetricEvent).values({
      storyId: targetStory.id,
      eventType: 'play_start',
    });

    return {
      success: true,
      episodePlays: newEpisodePlays,
      storyPlays: newStoryPlays,
      trendingScore: newScore,
    };
  }

  /**
   * Create a new story (Admin / Ingestion API).
   */
  async createStory(dto: CreateStoryDto): Promise<Story> {
    const slug = await this.generateUniqueSlug(dto.slug || dto.title);

    const [created] = await this.db
      .insert(story)
      .values({
        title: dto.title,
        slug,
        synopsis: dto.synopsis,
        coverUrl: dto.coverUrl,
        thumbnailUrl: dto.thumbnailUrl,
        author: dto.author || 'ShortStory',
        status: dto.status || 'published',
        isFeatured: dto.isFeatured ?? false,
      })
      .returning();

    // Associate genres
    await this.syncStoryGenres(created.id, dto.genreIds, dto.genreSlugs);

    return this.findByIdOrSlug(created.id);
  }

  /**
   * Update an existing story.
   */
  async updateStory(id: string, dto: UpdateStoryDto): Promise<Story> {
    const existing = await this.db.query.story.findFirst({
      where: eq(story.id, id),
    });

    if (!existing) {
      throw new NotFoundException('História não encontrada');
    }

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = await this.generateUniqueSlug(dto.slug, existing.id);
    } else if (dto.title && dto.title !== existing.title && !dto.slug) {
      slug = await this.generateUniqueSlug(dto.title, existing.id);
    }

    await this.db
      .update(story)
      .set({
        title: dto.title ?? existing.title,
        slug,
        synopsis: dto.synopsis ?? existing.synopsis,
        coverUrl: dto.coverUrl ?? existing.coverUrl,
        thumbnailUrl: dto.thumbnailUrl ?? existing.thumbnailUrl,
        author: dto.author ?? existing.author,
        status: dto.status ?? existing.status,
        isFeatured: dto.isFeatured ?? existing.isFeatured,
        updatedAt: new Date(),
      })
      .where(eq(story.id, id));

    if (dto.genreIds !== undefined || dto.genreSlugs !== undefined) {
      await this.syncStoryGenres(id, dto.genreIds, dto.genreSlugs);
    }

    return this.findByIdOrSlug(id);
  }

  /**
   * Delete a story (cascades to episodes, genres and metrics).
   */
  async deleteStory(id: string) {
    const existing = await this.db.query.story.findFirst({
      where: eq(story.id, id),
    });

    if (!existing) {
      throw new NotFoundException('História não encontrada');
    }

    await this.db.delete(story).where(eq(story.id, id));
    return { success: true, message: 'História removida com sucesso' };
  }

  /**
   * Add an episode to a story.
   */
  async addEpisode(storyId: string, dto: CreateEpisodeDto): Promise<Episode> {
    const targetStory = await this.db.query.story.findFirst({
      where: eq(story.id, storyId),
    });

    if (!targetStory) {
      throw new NotFoundException('História não encontrada');
    }

    const [created] = await this.db
      .insert(episode)
      .values({
        storyId,
        seasonNumber: dto.seasonNumber ?? 1,
        episodeNumber: dto.episodeNumber,
        title: dto.title,
        synopsis: dto.synopsis,
        durationSeconds: dto.durationSeconds ?? 0,
        audioUrl: dto.audioUrl,
        isPremium: dto.isPremium ?? false,
        status: dto.status ?? 'published',
      })
      .returning();

    return created;
  }

  /**
   * Update an episode.
   */
  async updateEpisode(episodeId: string, dto: UpdateEpisodeDto): Promise<Episode> {
    const existing = await this.db.query.episode.findFirst({
      where: eq(episode.id, episodeId),
    });

    if (!existing) {
      throw new NotFoundException('Episódio não encontrado');
    }

    const [updated] = await this.db
      .update(episode)
      .set({
        title: dto.title ?? existing.title,
        seasonNumber: dto.seasonNumber ?? existing.seasonNumber,
        episodeNumber: dto.episodeNumber ?? existing.episodeNumber,
        synopsis: dto.synopsis ?? existing.synopsis,
        durationSeconds: dto.durationSeconds ?? existing.durationSeconds,
        audioUrl: dto.audioUrl ?? existing.audioUrl,
        isPremium: dto.isPremium ?? existing.isPremium,
        status: dto.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(episode.id, episodeId))
      .returning();

    return updated;
  }

  /**
   * Delete an episode.
   */
  async deleteEpisode(episodeId: string) {
    const existing = await this.db.query.episode.findFirst({
      where: eq(episode.id, episodeId),
    });

    if (!existing) {
      throw new NotFoundException('Episódio não encontrado');
    }

    await this.db.delete(episode).where(eq(episode.id, episodeId));
    return { success: true, message: 'Episódio removido com sucesso' };
  }

  /**
   * Bulk import a complete story with episodes and genres.
   * Ideal for the local AI generation app to publish in a single request.
   */
  async importBulkStory(dto: BulkImportStoryDto) {
    const slug = await this.generateUniqueSlug(dto.slug || dto.title);

    const [createdStory] = await this.db
      .insert(story)
      .values({
        title: dto.title,
        slug,
        synopsis: dto.synopsis,
        coverUrl: dto.coverUrl,
        thumbnailUrl: dto.thumbnailUrl,
        author: dto.author || 'ShortStory AI',
        status: dto.status || 'published',
        isFeatured: dto.isFeatured ?? false,
      })
      .returning();

    // Link genres
    await this.syncStoryGenres(createdStory.id, dto.genreIds, dto.genreSlugs);

    // Insert episodes
    if (dto.episodes && dto.episodes.length > 0) {
      for (const ep of dto.episodes) {
        await this.db.insert(episode).values({
          storyId: createdStory.id,
          seasonNumber: ep.seasonNumber ?? 1,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          synopsis: ep.synopsis,
          durationSeconds: ep.durationSeconds ?? 0,
          audioUrl: ep.audioUrl,
          isPremium: ep.isPremium ?? false,
          status: ep.status ?? 'published',
        });
      }
    }

    return this.findByIdOrSlug(createdStory.id);
  }

  // --- Private Helpers ---

  private async generateUniqueSlug(base: string, currentId?: string): Promise<string> {
    const baseSlug = slugify(base);
    let finalSlug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.db.query.story.findFirst({
        where: eq(story.slug, finalSlug),
      });

      if (!existing || existing.id === currentId) {
        return finalSlug;
      }

      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  private async syncStoryGenres(
    storyId: string,
    genreIds?: string[],
    genreSlugs?: string[],
  ) {
    const targetGenreIds = new Set<string>();

    if (genreIds && genreIds.length > 0) {
      for (const id of genreIds) {
        targetGenreIds.add(id);
      }
    }

    if (genreSlugs && genreSlugs.length > 0) {
      const foundGenres = await this.db.query.genre.findMany({
        where: inArray(genre.slug, genreSlugs),
      });
      for (const g of foundGenres) {
        targetGenreIds.add(g.id);
      }
    }

    // Clear old associations
    await this.db.delete(storyGenre).where(eq(storyGenre.storyId, storyId));

    // Insert new associations
    for (const gid of targetGenreIds) {
      await this.db
        .insert(storyGenre)
        .values({
          storyId,
          genreId: gid,
        })
        .onConflictDoNothing();
    }
  }
}
