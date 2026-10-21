import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlaybackService } from './playback.service.js';
import { DailyQuotaService } from './daily-quota.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type {
  UpdateProgressDto,
  SyncBatchProgressDto,
} from './dto/playback.dto.js';

@Controller('playback')
@UseGuards(AuthGuard)
export class PlaybackController {
  constructor(
    private readonly playbackService: PlaybackService,
    private readonly dailyQuotaService: DailyQuotaService,
  ) {}

  /**
   * Save or update playback progress (invoked periodically e.g. every 15s and on pause).
   * POST /playback/progress
   */
  @Post('progress')
  @HttpCode(HttpStatus.OK)
  async saveProgress(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.playbackService.saveProgress(userId, dto);
  }

  /**
   * Batch synchronize offline playback progress when internet is restored.
   * POST /playback/sync
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncBatchProgress(
    @CurrentUser('id') userId: string,
    @Body() dto: SyncBatchProgressDto,
  ) {
    return this.playbackService.syncBatch(userId, dto.items);
  }

  /**
   * Get progress for a specific episode.
   * GET /playback/episode/:episodeId
   */
  @Get('episode/:episodeId')
  async getEpisodeProgress(
    @CurrentUser('id') userId: string,
    @Param('episodeId') episodeId: string,
  ) {
    return this.playbackService.getEpisodeProgress(userId, episodeId);
  }

  /**
   * Get the last listened story/episode to resume playback.
   * GET /playback/resume
   */
  @Get('resume')
  async getResume(@CurrentUser('id') userId: string) {
    return this.playbackService.getResume(userId);
  }

  /**
   * Get list of in-progress stories for the "Continuar Ouvindo" carousel.
   * GET /playback/continue-listening
   */
  @Get('continue-listening')
  async getContinueListening(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.playbackService.getContinueListening(
      userId,
      limit ? Number(limit) : 10,
    );
  }

  /**
   * Get current daily quota status for the authenticated user.
   * GET /playback/daily-quota
   */
  @Get('daily-quota')
  async getDailyQuota(@CurrentUser('id') userId: string) {
    return this.dailyQuotaService.getDailyQuota(userId);
  }

  /**
   * Request authorization to play an episode and consume daily quota if applicable.
   * POST /playback/episodes/:id/access
   */
  @Post('episodes/:id/access')
  @HttpCode(HttpStatus.OK)
  async requestEpisodeAccess(
    @CurrentUser('id') userId: string,
    @Param('id') episodeId: string,
  ) {
    return this.dailyQuotaService.requestPlaybackAccess(userId, episodeId);
  }
}

