import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../db/index.js';
import { user } from '../../db/schemas/user.table.js';
import { processedWebhookEvent } from '../../db/schemas/processed-webhook-event.table.js';

export interface RevenueCatEventPayload {
  id: string;
  type: string;
  app_user_id?: string;
  product_id?: string;
  entitlement_id?: string;
  expiration_at_ms?: number;
  purchased_at_ms?: number;
  environment?: 'SANDBOX' | 'PRODUCTION';
}

export interface WebhookResult {
  received: boolean;
  duplicate: boolean;
  actionTaken?: string;
}

@Injectable()
export class RevenueCatWebhookService {
  private readonly logger = new Logger(RevenueCatWebhookService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * Validates RevenueCat Webhook Bearer Authorization token.
   */
  validateAuthorization(authHeader?: string, expectedSecret?: string): void {
    if (!expectedSecret) {
      // If no secret configured in dev environment, allow
      return;
    }

    if (!authHeader) {
      throw new UnauthorizedException('Header de autorização ausente no webhook');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token !== expectedSecret) {
      throw new UnauthorizedException('Token de autenticação do webhook inválido');
    }
  }

  /**
   * Idempotently processes a RevenueCat webhook event and updates user subscription state.
   */
  async handleWebhookEvent(event: RevenueCatEventPayload): Promise<WebhookResult> {
    if (!event || !event.id) {
      return { received: false, duplicate: false, actionTaken: 'invalid_event' };
    }

    // 1. Idempotency Check: Prevent duplicate processing of the same event
    const existing = await this.db.query.processedWebhookEvent.findFirst({
      where: eq(processedWebhookEvent.id, event.id),
    });

    if (existing) {
      this.logger.log(`[RevenueCat] Evento duplicado ignorado: ${event.id} (${event.type})`);
      return { received: true, duplicate: true, actionTaken: 'already_processed' };
    }

    // 2. Mark event as processed
    await this.db.insert(processedWebhookEvent).values({
      id: event.id,
      eventType: event.type,
      appUserId: event.app_user_id || null,
      provider: 'revenuecat',
    });

    const targetUserId = event.app_user_id;
    if (!targetUserId) {
      return { received: true, duplicate: false, actionTaken: 'no_user_id' };
    }

    // 3. Process events that grant / maintain active subscription
    if (
      event.type === 'INITIAL_PURCHASE' ||
      event.type === 'RENEWAL' ||
      event.type === 'PRODUCT_CHANGE' ||
      event.type === 'UNCANCELLATION'
    ) {
      const expiresAt = event.expiration_at_ms
        ? new Date(event.expiration_at_ms)
        : null;

      await this.db
        .update(user)
        .set({
          subscriptionStatus: 'premium',
          subscriptionPlan: event.product_id || 'audiofic_pro',
          subscriptionExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(user.id, targetUserId));

      this.logger.log(
        `[RevenueCat] Usuário ${targetUserId} atualizado para PREMIUM via ${event.type}.`,
      );

      return {
        received: true,
        duplicate: false,
        actionTaken: 'activated_premium',
      };
    }

    // 4. Process event that revokes subscription upon actual expiration
    if (event.type === 'EXPIRATION') {
      await this.db
        .update(user)
        .set({
          subscriptionStatus: 'free',
          subscriptionPlan: null,
          subscriptionExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, targetUserId));

      this.logger.log(
        `[RevenueCat] Assinatura do usuário ${targetUserId} expirou. Rebaixado para FREE.`,
      );

      return {
        received: true,
        duplicate: false,
        actionTaken: 'downgraded_free',
      };
    }

    return {
      received: true,
      duplicate: false,
      actionTaken: `unhandled_event_type_${event.type}`,
    };
  }
}
