import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DailyQuotaService } from './daily-quota.service.js';
import { getBrasiliaDateString, getNextBrasiliaMidnight } from './utils/date.utils.js';

describe('DailyQuotaService (TDD)', () => {
  let service: DailyQuotaService;
  let mockDb: any;

  const freeUser = {
    id: 'user_free_1',
    name: 'Free Listener',
    email: 'free@audiofic.com',
    subscriptionStatus: 'free',
  };

  const proUser = {
    id: 'user_pro_1',
    name: 'PRO Listener',
    email: 'pro@audiofic.com',
    subscriptionStatus: 'premium',
  };

  const freeEpisode1 = {
    id: 'ep_free_1',
    title: 'Episódio 1 - O Chamado',
    isPremium: false,
    durationSeconds: 600,
    audioUrl: 'https://cdn.audiofic.com/ep1.mp3',
  };

  const freeEpisode2 = {
    id: 'ep_free_2',
    title: 'Episódio 2 - A Floresta',
    isPremium: false,
    durationSeconds: 720,
    audioUrl: 'https://cdn.audiofic.com/ep2.mp3',
  };

  const freeEpisode3 = {
    id: 'ep_free_3',
    title: 'Episódio 3 - Sussurros',
    isPremium: false,
    durationSeconds: 650,
    audioUrl: 'https://cdn.audiofic.com/ep3.mp3',
  };

  const freeEpisode4 = {
    id: 'ep_free_4',
    title: 'Episódio 4 - O Ritual',
    isPremium: false,
    durationSeconds: 800,
    audioUrl: 'https://cdn.audiofic.com/ep4.mp3',
  };

  const premiumEpisode = {
    id: 'ep_premium_5',
    title: 'Episódio 5 - Revelação Macabra',
    isPremium: true,
    durationSeconds: 900,
    audioUrl: 'https://cdn.audiofic.com/ep5.mp3',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Consulta de Cota Diária (getDailyQuota)', () => {
    it('deve retornar cota ilimitada quando o usuário for assinante PRO', async () => {
      mockDb = {
        query: {
          user: {
            findFirst: vi.fn().mockResolvedValue(proUser),
          },
          dailyListenQuota: {
            findMany: vi.fn(),
          },
        },
      };

      service = new DailyQuotaService(mockDb);
      const quota = await service.getDailyQuota(proUser.id);

      expect(quota.isUnlimited).toBe(true);
      expect(quota.dailyLimit).toBeNull();
      expect(quota.remainingCount).toBeNull();
      expect(mockDb.query.dailyListenQuota.findMany).not.toHaveBeenCalled();
    });

    it('deve retornar 3 episódios restantes quando o usuário gratuito não ouviu nenhum episódio hoje', async () => {
      mockDb = {
        query: {
          user: {
            findFirst: vi.fn().mockResolvedValue(freeUser),
          },
          dailyListenQuota: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        },
      };

      service = new DailyQuotaService(mockDb);
      const quota = await service.getDailyQuota(freeUser.id);

      expect(quota.isUnlimited).toBe(false);
      expect(quota.dailyLimit).toBe(3);
      expect(quota.usedCount).toBe(0);
      expect(quota.remainingCount).toBe(3);
      expect(quota.resetAt).toBeDefined();
    });

    it('deve calcular corretamente os episódios restantes quando já ouviu 1 episódio no dia', async () => {
      mockDb = {
        query: {
          user: {
            findFirst: vi.fn().mockResolvedValue(freeUser),
          },
          dailyListenQuota: {
            findMany: vi.fn().mockResolvedValue([
              { episodeId: 'ep_free_1', listenDate: getBrasiliaDateString() },
            ]),
          },
        },
      };

      service = new DailyQuotaService(mockDb);
      const quota = await service.getDailyQuota(freeUser.id);

      expect(quota.isUnlimited).toBe(false);
      expect(quota.usedCount).toBe(1);
      expect(quota.remainingCount).toBe(2);
      expect(quota.listenedEpisodeIds).toContain('ep_free_1');
    });
  });

  describe('2. Autorização de Reprodução (requestPlaybackAccess)', () => {
    it('deve autorizar reprodução sem descontar cota para usuário PRO em episódio gratuito ou premium', async () => {
      mockDb = {
        query: {
          user: {
            findFirst: vi.fn().mockResolvedValue(proUser),
          },
          episode: {
            findFirst: vi.fn().mockResolvedValue(premiumEpisode),
          },
          dailyListenQuota: {
            findMany: vi.fn(),
          },
        },
        insert: vi.fn(),
      };

      service = new DailyQuotaService(mockDb);
      const access = await service.requestPlaybackAccess(proUser.id, premiumEpisode.id);

      expect(access.authorized).toBe(true);
      expect(access.isUnlimited).toBe(true);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('deve bloquear usuário gratuito ao tentar acessar episódio nativamente premium', async () => {
      mockDb = {
        query: {
          user: {
            findFirst: vi.fn().mockResolvedValue(freeUser),
          },
          episode: {
            findFirst: vi.fn().mockResolvedValue(premiumEpisode),
          },
        },
      };

      service = new DailyQuotaService(mockDb);

      await expect(
        service.requestPlaybackAccess(freeUser.id, premiumEpisode.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve autorizar 1º episódio gratuito do dia e registrar cota', async () => {
      let insertedQuota: any = null;

      mockDb = {
        query: {
          user: {
            findFirst: vi.fn().mockResolvedValue(freeUser),
          },
          episode: {
            findFirst: vi.fn().mockResolvedValue(freeEpisode1),
          },
          dailyListenQuota: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        },
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockImplementation((val) => {
            insertedQuota = val;
            return {
              onConflictDoNothing: vi.fn().mockResolvedValue({}),
            };
          }),
        }),
      };

      service = new DailyQuotaService(mockDb);
      const access = await service.requestPlaybackAccess(freeUser.id, freeEpisode1.id);

      expect(access.authorized).toBe(true);
      expect(access.remainingCount).toBe(2);
      expect(insertedQuota).toBeDefined();
      expect(insertedQuota.userId).toBe(freeUser.id);
      expect(insertedQuota.episodeId).toBe(freeEpisode1.id);
      expect(insertedQuota.listenDate).toBe(getBrasiliaDateString());
    });

    it('NÃO deve descontar cota ao retomar ou ouvir novamente o mesmo episódio no mesmo dia', async () => {
      const today = getBrasiliaDateString();
      mockDb = {
        query: {
          user: {
            findFirst: vi.fn().mockResolvedValue(freeUser),
          },
          episode: {
            findFirst: vi.fn().mockResolvedValue(freeEpisode1),
          },
          dailyListenQuota: {
            // Já consta que ep_free_1 foi ouvido hoje
            findMany: vi.fn().mockResolvedValue([
              { episodeId: freeEpisode1.id, listenDate: today },
            ]),
          },
        },
        insert: vi.fn(),
      };

      service = new DailyQuotaService(mockDb);
      const access = await service.requestPlaybackAccess(freeUser.id, freeEpisode1.id);

      expect(access.authorized).toBe(true);
      // Como já estava na lista, mantém a cota restante (3 - 1 = 2) e NÃO faz novo insert
      expect(access.remainingCount).toBe(2);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('deve autorizar o 3º episódio distinto e zerar cota restante (remaining = 0)', async () => {
      const today = getBrasiliaDateString();
      mockDb = {
        query: {
          user: {
            findFirst: vi.fn().mockResolvedValue(freeUser),
          },
          episode: {
            findFirst: vi.fn().mockResolvedValue(freeEpisode3),
          },
          dailyListenQuota: {
            // Já ouviu ep 1 e ep 2 hoje
            findMany: vi.fn().mockResolvedValue([
              { episodeId: freeEpisode1.id, listenDate: today },
              { episodeId: freeEpisode2.id, listenDate: today },
            ]),
          },
        },
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoNothing: vi.fn().mockResolvedValue({}),
          }),
        }),
      };

      service = new DailyQuotaService(mockDb);
      const access = await service.requestPlaybackAccess(freeUser.id, freeEpisode3.id);

      expect(access.authorized).toBe(true);
      expect(access.remainingCount).toBe(0);
    });

    it('deve REJEITAR com 403 DAILY_LIMIT_EXCEEDED ao tentar o 4º episódio distinto no mesmo dia', async () => {
      const today = getBrasiliaDateString();
      mockDb = {
        query: {
          user: {
            findFirst: vi.fn().mockResolvedValue(freeUser),
          },
          episode: {
            findFirst: vi.fn().mockResolvedValue(freeEpisode4),
          },
          dailyListenQuota: {
            // Já consumiu seus 3 episódios gratuitos hoje (ep 1, ep 2, ep 3)
            findMany: vi.fn().mockResolvedValue([
              { episodeId: freeEpisode1.id, listenDate: today },
              { episodeId: freeEpisode2.id, listenDate: today },
              { episodeId: freeEpisode3.id, listenDate: today },
            ]),
          },
        },
        insert: vi.fn(),
      };

      service = new DailyQuotaService(mockDb);

      try {
        await service.requestPlaybackAccess(freeUser.id, freeEpisode4.id);
        expect.unreachable('Deveria ter lançado ForbiddenException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        const res = err.getResponse();
        expect(res.errorCode).toBe('DAILY_LIMIT_EXCEEDED');
        expect(res.remainingCount).toBe(0);
        expect(res.dailyLimit).toBe(3);
        expect(res.resetAt).toBeDefined();
      }
    });

    it('deve permitir reprodução de episódio já ouvido hoje mesmo se a cota de 3 estiver esgotada', async () => {
      const today = getBrasiliaDateString();
      mockDb = {
        query: {
          user: {
            findFirst: vi.fn().mockResolvedValue(freeUser),
          },
          episode: {
            findFirst: vi.fn().mockResolvedValue(freeEpisode2),
          },
          dailyListenQuota: {
            // Usuário ouviu ep1, ep2, ep3 hoje
            findMany: vi.fn().mockResolvedValue([
              { episodeId: freeEpisode1.id, listenDate: today },
              { episodeId: freeEpisode2.id, listenDate: today },
              { episodeId: freeEpisode3.id, listenDate: today },
            ]),
          },
        },
        insert: vi.fn(),
      };

      service = new DailyQuotaService(mockDb);
      // Re-ouvir o ep2 (que já está na lista) deve ser permitido!
      const access = await service.requestPlaybackAccess(freeUser.id, freeEpisode2.id);

      expect(access.authorized).toBe(true);
      expect(access.remainingCount).toBe(0);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se o episódio não existir', async () => {
      mockDb = {
        query: {
          user: {
            findFirst: vi.fn().mockResolvedValue(freeUser),
          },
          episode: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        },
      };

      service = new DailyQuotaService(mockDb);

      await expect(
        service.requestPlaybackAccess(freeUser.id, 'ep_inexistente'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Utilitários de Data & Fuso de Brasília (America/Sao_Paulo)', () => {
    it('deve formatar a data de Brasília no formato YYYY-MM-DD corretamente', () => {
      // 2026-10-21 02:00:00 UTC ainda é 2026-10-20 23:00:00 em Brasília (UTC-3)
      const lateNightUTC = new Date('2026-10-21T02:00:00.000Z');
      const bsbDate = getBrasiliaDateString(lateNightUTC);
      expect(bsbDate).toBe('2026-10-20');

      // 2026-10-21 03:00:00 UTC é 2026-10-21 00:00:00 em Brasília (novo dia!)
      const midnightUTC = new Date('2026-10-21T03:00:00.000Z');
      const nextDayBsb = getBrasiliaDateString(midnightUTC);
      expect(nextDayBsb).toBe('2026-10-21');
    });

    it('deve calcular o próximo reset à meia-noite de Brasília', () => {
      const fixedDate = new Date('2026-10-20T18:00:00.000Z');
      const nextMidnight = getNextBrasiliaMidnight(fixedDate);

      // Meia-noite de 2026-10-21 em Brasília equivale a 2026-10-21T03:00:00.000Z
      expect(nextMidnight.toISOString()).toBe('2026-10-21T03:00:00.000Z');
    });
  });
});
