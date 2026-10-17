import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { generateId } from './utils.js';
import { story } from './story.table.js';

export const episode = pgTable('episode', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  storyId: text('story_id')
    .notNull()
    .references(() => story.id, { onDelete: 'cascade' }),
  seasonNumber: integer('season_number').notNull().default(1),
  episodeNumber: integer('episode_number').notNull(),
  title: text('title').notNull(),
  synopsis: text('synopsis'),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  audioUrl: text('audio_url').notNull(),
  isPremium: boolean('is_premium').notNull().default(false),
  playsCount: integer('plays_count').notNull().default(0),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('published'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const episodeRelations = relations(episode, ({ one }) => ({
  story: one(story, {
    fields: [episode.storyId],
    references: [story.id],
  }),
}));

export type Episode = typeof episode.$inferSelect;
export type NewEpisode = typeof episode.$inferInsert;
