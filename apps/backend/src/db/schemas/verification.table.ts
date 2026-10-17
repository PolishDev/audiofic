import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { generateId } from './utils.js';

export const verification = pgTable('verification', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
