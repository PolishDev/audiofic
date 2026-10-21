import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { RevenueCatWebhookService } from './revenuecat-webhook.service.js';

@Module({
  controllers: [WebhooksController],
  providers: [RevenueCatWebhookService],
  exports: [RevenueCatWebhookService],
})
export class WebhooksModule {}
