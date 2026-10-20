import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { generateId } from './utils.js';
import { user } from './user.table.js';
import { story } from './story.table.js';

export const userFavorites = pgTable(
  'user_favorites',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    storyId: text('story_id')
      .notNull()
      .references(() => story.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('user_favorites_user_story_idx').on(
      table.userId,
      table.storyId,
    ),
  ],
);

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(user, {
    fields: [userFavorites.userId],
    references: [user.id],
  }),
  story: one(story, {
    fields: [userFavorites.storyId],
    references: [story.id],
  }),
}));

export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;
