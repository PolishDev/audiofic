import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Text,
  useAuth,
  useFavorites,
  useAppTheme,
  BottomTabInset,
} from '@/shared';
import type { FavoritedStoryItem } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POSTER_WIDTH = 92;
const POSTER_HEIGHT = 132;

export function ListsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isGuest } = useAuth();
  const { favorites, isLoading, removeFavorite, refreshFavorites } =
    useFavorites();
  const { colors, isDark } = useAppTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFavorites();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConfirmRemove = (storyId: string, storyTitle: string) => {
    Alert.alert(
      'Remover da Minha Lista',
      `Deseja remover "${storyTitle}" da sua lista de histórias salvas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => removeFavorite(storyId),
        },
      ],
    );
  };

  const handleNavigateToStory = (storyId: string) => {
    router.push(`/story/${storyId}` as any);
  };

  // 1. GUEST STATE (DESLOGADO)
  if (isGuest || !user) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 16,
          },
        ]}
      >
        <View style={styles.guestContainer}>
          <View
            style={[
              styles.guestIconCircle,
              { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)' },
            ]}
          >
            <Ionicons
              name="bookmark-outline"
              size={48}
              color={colors.primary}
            />
          </View>

          <Text style={[styles.guestTitle, { color: colors.text }]}>
            Sua Lista
          </Text>
          <Text
            style={[styles.guestDescription, { color: colors.textSecondary }]}
          >
            Faça login para salvar histórias e sincronizar seu progresso.
          </Text>

          <View style={styles.guestActionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.primaryAuthButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.primaryAuthButtonText}>Fazer Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.secondaryAuthButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text
                style={[
                  styles.secondaryAuthButtonText,
                  { color: colors.text },
                ]}
              >
                Criar Conta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 2. AUTHENTICATED STATE
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 16,
        },
      ]}
    >
      {/* Loading indicator */}
      {isLoading && !isRefreshing && favorites.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Carregando sua lista...
          </Text>
        </View>
      ) : favorites.length === 0 ? (
        /* Empty State */
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.emptyIconCircle,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.04)'
                  : 'rgba(0, 0, 0, 0.03)',
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="bookmarks-outline"
              size={40}
              color={colors.textSecondary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Sua lista está vazia
          </Text>
          <Text
            style={[styles.emptyDescription, { color: colors.textSecondary }]}
          >
            Salve histórias para ouvi-las mais tarde.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.exploreButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => router.push('/(app)/books')}
          >
            <Ionicons name="compass-outline" size={18} color="#FFFFFF" />
            <Text style={styles.exploreButtonText}>Explorar Catálogo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* List of favorites */
        <FlatList<FavoritedStoryItem>
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: BottomTabInset + 110 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const story = item.story;
            const primaryGenre =
              story.genres && story.genres.length > 0
                ? story.genres[0].name
                : 'Terror';

            return (
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleNavigateToStory(story.id)}
              >
                {/* Poster Cover */}
                <View style={styles.posterWrapper}>
                  {story.coverUrl ? (
                    <Image
                      source={{ uri: story.coverUrl }}
                      style={styles.posterImage}
                      contentFit="cover"
                      transition={250}
                    />
                  ) : (
                    <View
                      style={[
                        styles.posterImage,
                        {
                          backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA',
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}
                    >
                      <Ionicons
                        name="book-outline"
                        size={28}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                </View>

                {/* Details Column */}
                <View style={styles.cardDetails}>
                  {/* Genre Tag */}
                  {primaryGenre ? (
                    <View style={styles.genreTagRow}>
                      <Text
                        style={[
                          styles.genreText,
                          { color: colors.primary },
                        ]}
                      >
                        {primaryGenre}
                      </Text>
                    </View>
                  ) : null}

                  {/* Title */}
                  <Text
                    style={[styles.storyTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {story.title}
                  </Text>

                  {/* Synopsis */}
                  <Text
                    style={[
                      styles.storySynopsis,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {story.synopsis}
                  </Text>

                  {/* Footer Meta & Actions */}
                  <View style={styles.cardFooter}>
                    <View style={styles.episodesMeta}>
                      <Ionicons
                        name="headset-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.episodesText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {story.episodesCount}{' '}
                        {story.episodesCount === 1 ? 'episódio' : 'episódios'}
                      </Text>
                    </View>

                    {/* Quick remove button */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.removeButton,
                        {
                          borderColor: colors.border,
                        },
                      ]}
                      hitSlop={8}
                      onPress={() =>
                        handleConfirmRemove(story.id, story.title)
                      }
                    >
                      <Ionicons
                        name="bookmark"
                        size={16}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 10,
    gap: 14,
  },
  posterWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  posterImage: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 12,
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  genreTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genreText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  storySynopsis: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  episodesMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  episodesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    marginTop: -48
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    marginTop: -48
  },
  guestIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  guestDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  guestActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryAuthButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAuthButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryAuthButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryAuthButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
