import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  RevenueCatWebhookService,
  type RevenueCatEventPayload,
} from './revenuecat-webhook.service.js';

interface WebhookBody {
  event: RevenueCatEventPayload;
  api_version?: string;
}

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly revenueCatService: RevenueCatWebhookService,
  ) {}

  /**
   * Endpoint to receive asynchronous subscription events from RevenueCat.
   * POST /webhooks/revenuecat
   */
  @Post('revenuecat')
  @HttpCode(HttpStatus.OK)
  async handleRevenueCatWebhook(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: WebhookBody,
  ) {
    const expectedSecret = process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN;
    this.revenueCatService.validateAuthorization(authHeader, expectedSecret);

    const event = body?.event || (body as unknown as RevenueCatEventPayload);
    const result = await this.revenueCatService.handleWebhookEvent(event);

    return {
      success: true,
      ...result,
    };
  }
}
