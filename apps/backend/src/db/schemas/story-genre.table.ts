import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { story } from './story.table.js';
import { genre } from './genre.table.js';

export const storyGenre = pgTable(
  'story_genre',
  {
    storyId: text('story_id')
      .notNull()
      .references(() => story.id, { onDelete: 'cascade' }),
    genreId: text('genre_id')
      .notNull()
      .references(() => genre.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.storyId, t.genreId] })],
);

export const storyGenreRelations = relations(storyGenre, ({ one }) => ({
  story: one(story, {
    fields: [storyGenre.storyId],
    references: [story.id],
  }),
  genre: one(genre, {
    fields: [storyGenre.genreId],
    references: [genre.id],
  }),
}));

export type StoryGenre = typeof storyGenre.$inferSelect;
export type NewStoryGenre = typeof storyGenre.$inferInsert;
