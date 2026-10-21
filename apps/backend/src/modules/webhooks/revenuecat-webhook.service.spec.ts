import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { RevenueCatWebhookService } from './revenuecat-webhook.service.js';

describe('RevenueCatWebhookService (TDD)', () => {
  let service: RevenueCatWebhookService;
  let mockDb: any;
  const WEBHOOK_SECRET = 'rc_secret_test_token_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve rejeitar com UnauthorizedException se o token de autorização for inválido', async () => {
    mockDb = {};
    service = new RevenueCatWebhookService(mockDb);

    // Header inválido
    expect(() =>
      service.validateAuthorization('Bearer token_errado', WEBHOOK_SECRET),
    ).toThrow(UnauthorizedException);

    // Header ausente
    expect(() =>
      service.validateAuthorization(undefined, WEBHOOK_SECRET),
    ).toThrow(UnauthorizedException);
  });

  it('deve aceitar com sucesso se o token de autorização estiver correto', () => {
    mockDb = {};
    service = new RevenueCatWebhookService(mockDb);

    expect(() =>
      service.validateAuthorization(`Bearer ${WEBHOOK_SECRET}`, WEBHOOK_SECRET),
    ).not.toThrow();
  });

  it('deve retornar duplicate: true e não reprocessar se o event.id já tiver sido processado', async () => {
    mockDb = {
      query: {
        processedWebhookEvent: {
          findFirst: vi.fn().mockResolvedValue({ id: 'evt_123' }),
        },
      },
      update: vi.fn(),
    };

    service = new RevenueCatWebhookService(mockDb);
    const result = await service.handleWebhookEvent({
      id: 'evt_123',
      type: 'INITIAL_PURCHASE',
      app_user_id: 'user_1',
    });

    expect(result.duplicate).toBe(true);
    expect(result.received).toBe(true);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('deve processar INITIAL_PURCHASE e atualizar usuário para premium', async () => {
    let updatedUserData: any = null;
    let recordedEvent: any = null;

    mockDb = {
      query: {
        processedWebhookEvent: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((val) => {
          recordedEvent = val;
          return Promise.resolve();
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockImplementation((val) => {
          updatedUserData = val;
          return {
            where: vi.fn().mockResolvedValue([]),
          };
        }),
      }),
    };

    service = new RevenueCatWebhookService(mockDb);

    const expiresAtMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const result = await service.handleWebhookEvent({
      id: 'evt_purchase_1',
      type: 'INITIAL_PURCHASE',
      app_user_id: 'user_abc',
      product_id: 'audiofic_pro_monthly',
      expiration_at_ms: expiresAtMs,
    });

    expect(result.received).toBe(true);
    expect(result.duplicate).toBe(false);
    expect(recordedEvent.id).toBe('evt_purchase_1');
    expect(updatedUserData.subscriptionStatus).toBe('premium');
    expect(updatedUserData.subscriptionPlan).toBe('audiofic_pro_monthly');
    expect(updatedUserData.subscriptionExpiresAt).toEqual(new Date(expiresAtMs));
  });

  it('deve processar EXPIRATION e rebaixar usuário para plano free', async () => {
    let updatedUserData: any = null;

    mockDb = {
      query: {
        processedWebhookEvent: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockImplementation((val) => {
          updatedUserData = val;
          return {
            where: vi.fn().mockResolvedValue([]),
          };
        }),
      }),
    };

    service = new RevenueCatWebhookService(mockDb);

    const result = await service.handleWebhookEvent({
      id: 'evt_expire_1',
      type: 'EXPIRATION',
      app_user_id: 'user_xyz',
      product_id: 'audiofic_pro_monthly',
    });

    expect(result.received).toBe(true);
    expect(updatedUserData.subscriptionStatus).toBe('free');
    expect(updatedUserData.subscriptionPlan).toBeNull();
    expect(updatedUserData.subscriptionExpiresAt).toBeNull();
  });
});
