import { user, userRelations } from './user.table.js';
import { session, sessionRelations } from './session.table.js';
import { account, accountRelations } from './account.table.js';
import { verification } from './verification.table.js';
import { genre, genreRelations } from './genre.table.js';
import { story, storyRelations } from './story.table.js';
import { episode, episodeRelations } from './episode.table.js';
import { storyGenre, storyGenreRelations } from './story-genre.table.js';
import {
  storyMetricEvent,
  storyMetricEventRelations,
} from './story-metric-event.table.js';

export * from './utils.js';
export * from './user.table.js';
export * from './session.table.js';
export * from './account.table.js';
export * from './verification.table.js';
export * from './genre.table.js';
export * from './story.table.js';
export * from './episode.table.js';
export * from './story-genre.table.js';
export * from './story-metric-event.table.js';

export const schema = {
  user,
  userRelations,
  session,
  sessionRelations,
  account,
  accountRelations,
  verification,
  genre,
  genreRelations,
  story,
  storyRelations,
  episode,
  episodeRelations,
  storyGenre,
  storyGenreRelations,
  storyMetricEvent,
  storyMetricEventRelations,
};

export type AppSchema = typeof schema;
