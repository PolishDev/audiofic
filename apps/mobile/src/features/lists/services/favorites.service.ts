import { apiClient } from '../../../shared/api/axios-client';
import type { FavoritedStoryItem } from '../types';

export const favoritesService = {
  /**
   * Fetch all favorited stories for current authenticated user.
   */
  async getMyFavorites(): Promise<FavoritedStoryItem[]> {
    const res = await apiClient.get<FavoritedStoryItem[]>('/favorites');
    return res.data;
  },

  /**
   * Check if a story is favorited.
   */
  async checkFavoriteStatus(storyId: string): Promise<boolean> {
    const res = await apiClient.get<{ isFavorite: boolean }>(
      `/favorites/${storyId}/status`,
    );
    return res.data.isFavorite;
  },

  /**
   * Toggle favorite state for a story.
   */
  async toggleFavorite(
    storyId: string,
  ): Promise<{ success: boolean; isFavorite: boolean; message: string }> {
    const res = await apiClient.post<{
      success: boolean;
      isFavorite: boolean;
      message: string;
    }>(`/favorites/${storyId}/toggle`);
    return res.data;
  },

  /**
   * Remove a story from favorites.
   */
  async removeFavorite(
    storyId: string,
  ): Promise<{ success: boolean; isFavorite: boolean; message: string }> {
    const res = await apiClient.delete<{
      success: boolean;
      isFavorite: boolean;
      message: string;
    }>(`/favorites/${storyId}`);
    return res.data;
  },
};
