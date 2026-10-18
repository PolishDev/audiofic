import { apiClient } from '@/shared/api/axios-client';

export interface SearchGenre {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export interface SearchStory {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  coverUrl?: string | null;
  thumbnailUrl?: string | null;
  author?: string;
  playsCount?: number;
  viewsCount?: number;
  trendingScore?: number;
  genres?: SearchGenre[];
  episodesCount?: number;
}

/**
 * Fetch Top 10 most listened stories.
 */
export async function fetchTopListenedStories(limit: number = 10): Promise<SearchStory[]> {
  try {
    const res = await apiClient.get<SearchStory[]>('/stories/top-listened', {
      params: { limit },
    });
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  } catch (error) {
    console.warn('[searchApi] Error fetching top listened stories:', error);
    return [];
  }
}

/**
 * Search stories with accent insensitivity and typo tolerance.
 */
export async function searchStories(
  query: string,
  limit: number = 20,
  signal?: AbortSignal,
): Promise<SearchStory[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const res = await apiClient.get<SearchStory[]>('/stories/search', {
      params: { q: trimmed, limit },
      signal,
    });
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  } catch (error: any) {
    // Ignore canceled requests
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
      return [];
    }
    console.warn('[searchApi] Error searching stories:', error);
    return [];
  }
}
