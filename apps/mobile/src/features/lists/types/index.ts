export interface FavoritedStoryItem {
  id: string;
  favoritedAt: string;
  story: {
    id: string;
    title: string;
    slug: string;
    synopsis: string;
    coverUrl: string;
    thumbnailUrl?: string | null;
    author: string;
    status: string;
    viewsCount: number;
    playsCount: number;
    genres: Array<{
      id: string;
      name: string;
      slug: string;
      color?: string | null;
      icon?: string | null;
    }>;
    episodesCount: number;
  };
}
