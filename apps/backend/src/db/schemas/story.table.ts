import { pgTable, text, timestamp, boolean, integer, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { generateId } from './utils.js';
import { episode } from './episode.table.js';
import { storyGenre } from './story-genre.table.js';
import { storyMetricEvent } from './story-metric-event.table.js';

export const story = pgTable('story', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  synopsis: text('synopsis').notNull(),
  coverUrl: text('cover_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  author: text('author').notNull().default('ShortStory'),
  status: text('status', { enum: ['draft', 'published', 'archived'] })
    .notNull()
    .default('published'),
  isFeatured: boolean('is_featured').notNull().default(false),
  viewsCount: integer('views_count').notNull().default(0),
  playsCount: integer('plays_count').notNull().default(0),
  trendingScore: real('trending_score').notNull().default(0),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const storyRelations = relations(story, ({ many }) => ({
  episodes: many(episode),
  genres: many(storyGenre),
  metrics: many(storyMetricEvent),
}));

export type Story = typeof story.$inferSelect;
export type NewStory = typeof story.$inferInsert;
