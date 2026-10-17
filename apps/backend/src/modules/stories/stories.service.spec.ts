import { describe, it, expect } from 'vitest';
import { calculateTrendingScore } from './stories.service.js';
import { slugify } from '../../common/utils/slugify.js';

describe('Stories Utilities', () => {
  describe('slugify', () => {
    it('should convert portuguese titles with accents and special characters to clean slugs', () => {
      expect(slugify('O Sussurro na Névoa & Outros Contos')).toBe(
        'o-sussurro-na-nevoa-outros-contos',
      );
      expect(slugify('A Maldição do Casarão: Capítulo 1')).toBe(
        'a-maldicao-do-casarao-capitulo-1',
      );
      expect(slugify('  Espaço   Duplo  ')).toBe('espaco-duplo');
    });
  });

  describe('calculateTrendingScore', () => {
    it('should score stories with higher plays higher than views', () => {
      const now = new Date();
      // Story A: 10 views, 0 plays
      const scoreA = calculateTrendingScore(10, 0, now);
      // Story B: 0 views, 10 plays (plays weight = 3)
      const scoreB = calculateTrendingScore(0, 10, now);

      expect(scoreB).toBeGreaterThan(scoreA);
    });

    it('should decay score over time for older stories', () => {
      const freshDate = new Date();
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

      const freshScore = calculateTrendingScore(100, 50, freshDate);
      const oldScore = calculateTrendingScore(100, 50, oldDate);

      expect(freshScore).toBeGreaterThan(oldScore);
    });
  });
});
