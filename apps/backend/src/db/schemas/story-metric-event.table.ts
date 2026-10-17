import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { generateId } from './utils.js';
import { story } from './story.table.js';

export const storyMetricEvent = pgTable('story_metric_event', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  storyId: text('story_id')
    .notNull()
    .references(() => story.id, { onDelete: 'cascade' }),
  eventType: text('event_type', {
    enum: ['view', 'play_start', 'play_complete'],
  }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const storyMetricEventRelations = relations(storyMetricEvent, ({ one }) => ({
  story: one(story, {
    fields: [storyMetricEvent.storyId],
    references: [story.id],
  }),
}));

export type StoryMetricEvent = typeof storyMetricEvent.$inferSelect;
export type NewStoryMetricEvent = typeof storyMetricEvent.$inferInsert;
