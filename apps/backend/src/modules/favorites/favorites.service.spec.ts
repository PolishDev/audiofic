import { describe, it, expect, vi } from 'vitest';
import { FavoritesService } from './favorites.service.js';

describe('FavoritesService', () => {
  it('should toggle favorite from false to true when not in favorites', async () => {
    let insertedValue: any = null;

    const mockDb: any = {
      query: {
        userFavorites: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        story: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'story-1',
            title: 'O Chamado da Meia-Noite',
          }),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((val) => {
          insertedValue = val;
          return {
            onConflictDoNothing: vi.fn().mockResolvedValue([]),
          };
        }),
      }),
      delete: vi.fn(),
    };

    const service = new FavoritesService(mockDb);
    const result = await service.toggleFavorite('user-1', 'story-1');

    expect(result.success).toBe(true);
    expect(result.isFavorite).toBe(true);
    expect(insertedValue).toEqual({
      userId: 'user-1',
      storyId: 'story-1',
    });
  });

  it('should toggle favorite from true to false when already in favorites', async () => {
    let deletedWhereCalled = false;

    const mockDb: any = {
      query: {
        userFavorites: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'fav-1',
            userId: 'user-1',
            storyId: 'story-1',
          }),
        },
      },
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          deletedWhereCalled = true;
          return Promise.resolve();
        }),
      }),
    };

    const service = new FavoritesService(mockDb);
    const result = await service.toggleFavorite('user-1', 'story-1');

    expect(result.success).toBe(true);
    expect(result.isFavorite).toBe(false);
    expect(deletedWhereCalled).toBe(true);
  });

  it('should return list of formatted favorites for a user', async () => {
    const mockDb: any = {
      query: {
        userFavorites: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'fav-1',
              createdAt: new Date('2026-10-19T10:00:00Z'),
              story: {
                id: 'story-1',
                title: 'O Farol Esquecido',
                status: 'published',
                genres: [{ genre: { id: 'g1', name: 'Terror Sobrenatural' } }],
                episodes: [{ id: 'ep1' }, { id: 'ep2' }],
              },
            },
          ]),
        },
      },
    };

    const service = new FavoritesService(mockDb);
    const result = await service.listFavorites('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].story.title).toBe('O Farol Esquecido');
    expect(result[0].story.genres[0].name).toBe('Terror Sobrenatural');
    expect(result[0].story.episodesCount).toBe(2);
  });
});
