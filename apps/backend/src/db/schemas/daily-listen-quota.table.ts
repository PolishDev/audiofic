import { pgTable, text, date, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { generateId } from './utils.js';
import { user } from './user.table.js';
import { episode } from './episode.table.js';

export const dailyListenQuota = pgTable(
  'daily_listen_quota',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    episodeId: text('episode_id')
      .notNull()
      .references(() => episode.id, { onDelete: 'cascade' }),
    listenDate: date('listen_date').notNull(), // Formato YYYY-MM-DD
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userEpisodeDateIdx: uniqueIndex('user_episode_date_idx').on(
      table.userId,
      table.episodeId,
      table.listenDate,
    ),
    userDateIdx: uniqueIndex('user_date_idx').on(
      table.userId,
      table.listenDate,
      table.id,
    ),
  }),
);

export const dailyListenQuotaRelations = relations(dailyListenQuota, ({ one }) => ({
  user: one(user, {
    fields: [dailyListenQuota.userId],
    references: [user.id],
  }),
  episode: one(episode, {
    fields: [dailyListenQuota.episodeId],
    references: [episode.id],
  }),
}));

export type DailyListenQuota = typeof dailyListenQuota.$inferSelect;
export type NewDailyListenQuota = typeof dailyListenQuota.$inferInsert;
