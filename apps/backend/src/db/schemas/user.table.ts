import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { generateId } from './utils.js';
import { session } from './session.table.js';
import { account } from './account.table.js';
import { userProgress } from './user-progress.table.js';
import { userFavorites } from './user-favorites.table.js';

export const user = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  progress: many(userProgress),
  favorites: many(userFavorites),
}));

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
