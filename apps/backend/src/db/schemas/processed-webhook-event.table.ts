import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const processedWebhookEvent = pgTable('processed_webhook_event', {
  id: text('id').primaryKey(), // RevenueCat event.id
  provider: text('provider').notNull().default('revenuecat'),
  eventType: text('event_type').notNull(),
  appUserId: text('app_user_id'),
  processedAt: timestamp('processed_at').notNull().defaultNow(),
});

export type ProcessedWebhookEvent = typeof processedWebhookEvent.$inferSelect;
export type NewProcessedWebhookEvent = typeof processedWebhookEvent.$inferInsert;
