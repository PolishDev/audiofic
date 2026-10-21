import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../db/index.js';
import { user } from '../../db/schemas/user.table.js';
import { episode } from '../../db/schemas/episode.table.js';
import { dailyListenQuota } from '../../db/schemas/daily-listen-quota.table.js';
import {
  getBrasiliaDateString,
  getNextBrasiliaMidnight,
} from './utils/date.utils.js';

export interface DailyQuotaResult {
  isUnlimited: boolean;
  dailyLimit: number | null;
  usedCount: number;
  remainingCount: number | null;
  resetAt: Date | null;
  listenedEpisodeIds: string[];
}

export interface PlaybackAccessResult {
  authorized: boolean;
  isUnlimited: boolean;
  remainingCount: number | null;
  resetAt: Date | null;
  audioUrl?: string;
}

@Injectable()
export class DailyQuotaService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * Returns current daily quota status for an authenticated user.
   */
  async getDailyQuota(userId: string): Promise<DailyQuotaResult> {
    const targetUser = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    const isPro =
      targetUser?.subscriptionStatus === 'premium' ||
      (targetUser as any)?.isPremium === true;

    if (isPro) {
      return {
        isUnlimited: true,
        dailyLimit: null,
        usedCount: 0,
        remainingCount: null,
        resetAt: null,
        listenedEpisodeIds: [],
      };
    }

    const todayStr = getBrasiliaDateString();
    const records = await this.db.query.dailyListenQuota.findMany({
      where: and(
        eq(dailyListenQuota.userId, userId),
        eq(dailyListenQuota.listenDate, todayStr),
      ),
    });

    const usedCount = records.length;
    const dailyLimit = 3;
    const remainingCount = Math.max(0, dailyLimit - usedCount);
    const resetAt = getNextBrasiliaMidnight();
    const listenedEpisodeIds = records.map((r) => r.episodeId);

    return {
      isUnlimited: false,
      dailyLimit,
      usedCount,
      remainingCount,
      resetAt,
      listenedEpisodeIds,
    };
  }

  /**
   * Requests playback access for an episode, consuming quota if applicable.
   * Throws ForbiddenException if limit is reached or if episode is premium.
   */
  async requestPlaybackAccess(
    userId: string,
    episodeId: string,
  ): Promise<PlaybackAccessResult> {
    const targetUser = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    const targetEpisode = await this.db.query.episode.findFirst({
      where: eq(episode.id, episodeId),
    });

    if (!targetEpisode) {
      throw new NotFoundException('Episódio não encontrado');
    }

    const isPro =
      targetUser?.subscriptionStatus === 'premium' ||
      (targetUser as any)?.isPremium === true;

    // 1. Episódio nativamente Premium: Exclusivo para assinantes PRO
    if (targetEpisode.isPremium) {
      if (!isPro) {
        throw new ForbiddenException({
          statusCode: 403,
          errorCode: 'PREMIUM_SUBSCRIPTION_REQUIRED',
          message: 'Este episódio é exclusivo para assinantes AudioFic PRO.',
          isPremium: true,
        });
      }
      return {
        authorized: true,
        isUnlimited: true,
        remainingCount: null,
        resetAt: null,
        audioUrl: targetEpisode.audioUrl,
      };
    }

    // 2. Episódio Gratuito para Assinante PRO: Ilimitado sem consumir cota
    if (isPro) {
      return {
        authorized: true,
        isUnlimited: true,
        remainingCount: null,
        resetAt: null,
        audioUrl: targetEpisode.audioUrl,
      };
    }

    // 3. Episódio Gratuito para Usuário no Plano Gratuito: Validação de cota diária (3/dia)
    const todayStr = getBrasiliaDateString();
    const resetAt = getNextBrasiliaMidnight();

    const todayRecords = await this.db.query.dailyListenQuota.findMany({
      where: and(
        eq(dailyListenQuota.userId, userId),
        eq(dailyListenQuota.listenDate, todayStr),
      ),
    });

    const alreadyListened = todayRecords.some((r) => r.episodeId === episodeId);

    // Se já ouviu esse mesmo episódio hoje, libera sem descontar cota adicional
    if (alreadyListened) {
      const remainingCount = Math.max(0, 3 - todayRecords.length);
      return {
        authorized: true,
        isUnlimited: false,
        remainingCount,
        resetAt,
        audioUrl: targetEpisode.audioUrl,
      };
    }

    // Se já consumiu 3 ou mais episódios distintos hoje, rejeita com erro estruturado
    if (todayRecords.length >= 3) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: 'DAILY_LIMIT_EXCEEDED',
        message:
          'Você atingiu seu limite de 3 episódios gratuitos por hoje. Seja PRO para ouvir sem limites ou volte amanhã.',
        dailyLimit: 3,
        remainingCount: 0,
        resetAt,
      });
    }

    // Consome cota (registra o episódio para a data de hoje de forma idempotente)
    await this.db
      .insert(dailyListenQuota)
      .values({
        userId,
        episodeId,
        listenDate: todayStr,
      })
      .onConflictDoNothing();

    const remainingCount = Math.max(0, 3 - (todayRecords.length + 1));

    return {
      authorized: true,
      isUnlimited: false,
      remainingCount,
      resetAt,
      audioUrl: targetEpisode.audioUrl,
    };
  }
}
