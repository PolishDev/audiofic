import { describe, it, expect, vi } from 'vitest';
import { PlaybackService } from './playback.service.js';

describe('PlaybackService', () => {
  it('should mark progress as completed when position is near duration', async () => {
    let insertedValues: any = null;

    const mockDb: any = {
      query: {
        episode: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'ep1',
            durationSeconds: 600, // 10 minutes
          }),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((val) => {
          insertedValues = val;
          return {
            onConflictDoUpdate: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([val]),
            }),
          };
        }),
      }),
    };

    const service = new PlaybackService(mockDb);

    // Test: position is 596 seconds (within 5 seconds of 600)
    const result = await service.saveProgress('user1', {
      episodeId: 'ep1',
      positionSeconds: 596,
    });

    expect(result.success).toBe(true);
    expect(insertedValues.isCompleted).toBe(true);
    expect(insertedValues.positionSeconds).toBe(596);
  });

  it('should keep progress as incomplete when listening in the middle', async () => {
    let insertedValues: any = null;

    const mockDb: any = {
      query: {
        episode: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'ep1',
            durationSeconds: 600,
          }),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((val) => {
          insertedValues = val;
          return {
            onConflictDoUpdate: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([val]),
            }),
          };
        }),
      }),
    };

    const service = new PlaybackService(mockDb);

    // Test: position is 360 seconds (6 minutes)
    const result = await service.saveProgress('user1', {
      episodeId: 'ep1',
      positionSeconds: 360,
    });

    expect(result.success).toBe(true);
    expect(insertedValues.isCompleted).toBe(false);
    expect(insertedValues.positionSeconds).toBe(360);
  });
});
