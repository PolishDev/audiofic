import { describe, it, expect } from 'vitest';
import {
  createStorySchema,
  createEpisodeSchema,
  bulkImportStorySchema,
} from './dto/story.dto.js';

describe('Story DTO Validation', () => {
  it('should validate valid story input', () => {
    const input = {
      title: 'O Sussurro da Floresta',
      synopsis: 'Uma lenda esquecida nas matas do interior paulista...',
      coverUrl: 'https://cdn.example.com/cover.jpg',
      author: 'AudioFic Studio',
      genreSlugs: ['terror-sobrenatural', 'lendas-folclore'],
    };

    const result = createStorySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('published');
      expect(result.data.author).toBe('AudioFic Studio');
    }
  });

  it('should reject story without title or synopsis', () => {
    const input = {
      coverUrl: 'https://cdn.example.com/cover.jpg',
    };

    const result = createStorySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should validate episode with positive numbers', () => {
    const validEp = {
      title: 'O Primeiro Contato',
      episodeNumber: 1,
      durationSeconds: 180,
      audioUrl: 'https://cdn.example.com/audio1.mp3',
      isPremium: false,
    };

    const result = createEpisodeSchema.safeParse(validEp);
    expect(result.success).toBe(true);
  });

  it('should validate bulk import payload for local AI integration', () => {
    const bulkPayload = {
      title: 'A Casa da Colina Maldita',
      synopsis: 'Gritos ecoam quando a tempestade cai...',
      coverUrl: 'https://cdn.example.com/hill-house.jpg',
      author: 'Local AI Generator',
      genreSlugs: ['terror-sobrenatural'],
      episodes: [
        {
          episodeNumber: 1,
          title: 'A Chegada',
          durationSeconds: 240,
          audioUrl: 'https://cdn.example.com/ep1.mp3',
          isPremium: false,
        },
        {
          episodeNumber: 2,
          title: 'O Porão',
          durationSeconds: 310,
          audioUrl: 'https://cdn.example.com/ep2.mp3',
          isPremium: true,
        },
      ],
    };

    const result = bulkImportStorySchema.safeParse(bulkPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.episodes).toHaveLength(2);
      expect(result.data.episodes[1].isPremium).toBe(true);
    }
  });
});
