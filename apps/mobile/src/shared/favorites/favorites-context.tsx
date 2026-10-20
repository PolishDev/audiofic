import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/auth-context';
import { useToast } from '../components/ui/toast';
import { favoritesService } from '../../features/lists/services/favorites.service';
import type { FavoritedStoryItem } from '../../features/lists/types';

interface FavoritesContextType {
  favorites: FavoritedStoryItem[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  isFavorite: (storyId: string) => boolean;
  toggleFavorite: (story: { id: string; title: string }) => Promise<boolean>;
  removeFavorite: (storyId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const toast = useToast();

  const [favorites, setFavorites] = useState<FavoritedStoryItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshFavorites = useCallback(async () => {
    if (!user || isGuest) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    try {
      setIsLoading(true);
      const items = await favoritesService.getMyFavorites();
      setFavorites(items);
      setFavoriteIds(new Set(items.map((item) => item.story.id)));
    } catch (err: any) {
      console.warn(
        '[FavoritesProvider] Erro ao carregar favoritos:',
        err?.message || err,
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, isGuest]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback(
    (storyId: string): boolean => {
      return favoriteIds.has(storyId);
    },
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    async (story: { id: string; title: string }): Promise<boolean> => {
      // 1. Guard: Only authenticated users can favorite stories
      if (!user || isGuest) {
        Alert.alert(
          'Recurso para Usuários',
          'Crie uma conta gratuita ou entre para salvar histórias na sua lista pessoal e sincronizar entre seus dispositivos.',
          [
            { text: 'Agora Não', style: 'cancel' },
            {
              text: 'Entrar',
              style: 'default',
              onPress: () => router.push('/(auth)/login'),
            },
          ],
        );
        return false;
      }

      const wasFavorite = favoriteIds.has(story.id);
      const newFavoriteState = !wasFavorite;

      // 2. Optimistic UI update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (newFavoriteState) {
          next.add(story.id);
        } else {
          next.delete(story.id);
        }
        return next;
      });

      if (!newFavoriteState) {
        setFavorites((prev) => prev.filter((item) => item.story.id !== story.id));
      }

      // 3. API request to backend
      try {
        const res = await favoritesService.toggleFavorite(story.id);
        if (res.isFavorite) {
          toast.success('Minha Lista', `"${story.title}" adicionada à sua lista.`);
        } else {
          toast.info('Minha Lista', `"${story.title}" removida da sua lista.`);
        }

        // Background sync to ensure all data is consistent
        refreshFavorites().catch(() => {});
        return res.isFavorite;
      } catch (err: any) {
        // Rollback optimistic update on error
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) {
            next.add(story.id);
          } else {
            next.delete(story.id);
          }
          return next;
        });
        refreshFavorites().catch(() => {});

        toast.error(
          'Erro ao salvar',
          'Não foi possível atualizar sua lista. Verifique sua conexão.',
        );
        return wasFavorite;
      }
    },
    [user, isGuest, favoriteIds, router, toast, refreshFavorites],
  );

  const removeFavorite = useCallback(
    async (storyId: string) => {
      if (!user || isGuest) return;

      const target = favorites.find((f) => f.story.id === storyId);
      const title = target?.story.title || 'História';

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(storyId);
        return next;
      });
      setFavorites((prev) => prev.filter((f) => f.story.id !== storyId));

      try {
        await favoritesService.removeFavorite(storyId);
        toast.info('Minha Lista', `"${title}" removida da sua lista.`);
      } catch (err: any) {
        // Rollback
        refreshFavorites().catch(() => {});
        toast.error('Erro ao remover', 'Tente novamente em instantes.');
      }
    },
    [user, isGuest, favorites, toast, refreshFavorites],
  );

  const contextValue = useMemo(
    () => ({
      favorites,
      favoriteIds,
      isLoading,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      refreshFavorites,
    }),
    [
      favorites,
      favoriteIds,
      isLoading,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      refreshFavorites,
    ],
  );

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites deve ser usado dentro de um FavoritesProvider');
  }
  return context;
}
