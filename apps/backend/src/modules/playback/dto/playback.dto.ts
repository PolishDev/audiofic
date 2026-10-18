import { z } from 'zod';

export const updateProgressSchema = z.object({
  episodeId: z.string().min(1, 'ID do episódio é obrigatório'),
  positionSeconds: z.number().nonnegative('Posição em segundos deve ser positiva'),
  isCompleted: z.boolean().optional(),
  updatedAt: z.string().optional(),
});

export type UpdateProgressDto = z.infer<typeof updateProgressSchema>;

export const syncBatchProgressSchema = z.object({
  items: z.array(updateProgressSchema),
});

export type SyncBatchProgressDto = z.infer<typeof syncBatchProgressSchema>;
