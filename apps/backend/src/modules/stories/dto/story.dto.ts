import { z } from 'zod';

export const createStorySchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  slug: z.string().optional(),
  synopsis: z.string().min(1, 'Sinopse é obrigatória'),
  coverUrl: z.string().min(1, 'URL da capa é obrigatória'),
  thumbnailUrl: z.string().optional(),
  author: z.string().optional().default('AudioFic'),
  status: z.enum(['draft', 'published', 'archived']).optional().default('published'),
  isFeatured: z.boolean().optional().default(false),
  genreIds: z.array(z.string()).optional().default([]),
  genreSlugs: z.array(z.string()).optional().default([]),
});

export type CreateStoryDto = z.infer<typeof createStorySchema>;

export const updateStorySchema = createStorySchema.partial();
export type UpdateStoryDto = z.infer<typeof updateStorySchema>;

export const createEpisodeSchema = z.object({
  title: z.string().min(1, 'Título do episódio é obrigatório'),
  seasonNumber: z.number().int().positive().optional().default(1),
  episodeNumber: z.number().int().positive('Número do episódio deve ser positivo'),
  synopsis: z.string().optional(),
  durationSeconds: z.number().int().nonnegative().optional().default(0),
  audioUrl: z.string().min(1, 'URL do áudio é obrigatória'),
  isPremium: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published']).optional().default('published'),
});

export type CreateEpisodeDto = z.infer<typeof createEpisodeSchema>;

export const updateEpisodeSchema = createEpisodeSchema.partial();
export type UpdateEpisodeDto = z.infer<typeof updateEpisodeSchema>;

export const bulkImportStorySchema = createStorySchema.extend({
  episodes: z.array(createEpisodeSchema).optional().default([]),
});

export type BulkImportStoryDto = z.infer<typeof bulkImportStorySchema>;

export interface StoryQueryParams {
  genre?: string;
  search?: string;
  status?: 'draft' | 'published' | 'archived';
  sort?: 'trending' | 'popular' | 'recent';
  page?: number;
  limit?: number;
}
