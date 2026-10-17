import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { generateId } from './utils.js';
import { storyGenre } from './story-genre.table.js';

export const genre = pgTable('genre', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const genreRelations = relations(genre, ({ many }) => ({
  stories: many(storyGenre),
}));

export type Genre = typeof genre.$inferSelect;
export type NewGenre = typeof genre.$inferInsert;
