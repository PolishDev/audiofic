import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/shared';
import { apiClient } from '@/shared/api/axios-client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 490;
const POSTER_WIDTH = 126;
const POSTER_HEIGHT = 186;

export interface Story {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  coverUrl?: string | null;
  author?: string;
  isFeatured?: boolean;
  genres?: Array<{ id: string; name: string; color?: string; slug: string }>;
  episodesCount?: number;
  episodes?: Array<{
    id: string;
    episodeNumber: number;
    durationSeconds: number;
    isPremium: boolean;
  }>;
}

export function BooksPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const heroScrollRef = useRef<ScrollView>(null);

  const handleOpenStory = (targetStory: Story) => {
    router.push({
      pathname: '/story/[id]',
      params: { id: targetStory.id },
    });
  };

  const fetchStories = useCallback(async () => {
    try {
      const res = await apiClient.get('/stories');
      if (res.data && Array.isArray(res.data.data)) {
        setStories(res.data.data);
      }
    } catch (err: any) {
      console.warn('[BooksPage] Error loading stories:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchStories();
  };

  const handleHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (pageIndex !== activeHeroIdx && pageIndex >= 0 && pageIndex < featuredStories.length) {
      setActiveHeroIdx(pageIndex);
    }
  };

  // Featured stories for the top Hero carousel
  const featuredStories = stories.length > 0 ? stories : [];

  // Filter lists by category/theme
  const supernaturalStories = stories.filter((s) =>
    s.genres?.some((g) => g.slug === 'terror-sobrenatural')
  );
  const psychologicalStories = stories.filter((s) =>
    s.genres?.some((g) => g.slug === 'suspense-psicologico')
  );
  const cosmicStories = stories.filter((s) =>
    s.genres?.some((g) => g.slug === 'horror-cosmico')
  );
  const folkloreStories = stories.filter((s) =>
    s.genres?.some((g) => g.slug === 'lendas-folclore')
  );

  return (
    <View style={styles.screen}>
      {/* HEADER GLOBAL FIXO (NÃO DESLIZA COM AS CAPAS DO CARROSSEL) */}
      <LinearGradient
        colors={['rgba(9, 9, 11, 0.95)', 'rgba(9, 9, 11, 0.6)', 'transparent']}
        style={[styles.globalHeader, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <View style={styles.brandRow}>
          <View style={styles.brandLogo}>
            <Ionicons name="book" size={18} color="#E11D48" />
            <Text style={styles.brandText}>SHORTSTORY</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#A62B32"
            colors={['#A62B32']}
          />
        }
      >
        {/* ======================================================== */}
        {/* 1. HERO CAROUSEL COM FADE PRETO (ESTILO NETFLIX / HBO)    */}
        {/* ======================================================== */}
        {featuredStories.length > 0 ? (
          <View style={styles.heroContainer}>
            <ScrollView
              ref={heroScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleHeroScroll}
              scrollEventThrottle={16}
              style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}
            >
              {featuredStories.map((story) => (
                <View key={story.id} style={styles.heroSlide}>
                  {/* Background Artwork */}
                  {story.coverUrl ? (
                    <Image
                      source={{ uri: story.coverUrl }}
                      style={styles.heroImage}
                      contentFit="cover"
                      priority="high"
                    />
                  ) : (
                    <View style={[styles.heroImage, { backgroundColor: '#18181B' }]} />
                  )}

                  {/* Bottom Cinematic Fade to Black */}
                  <LinearGradient
                    colors={[
                      'transparent',
                      'rgba(9, 9, 11, 0.2)',
                      'rgba(9, 9, 11, 0.65)',
                      'rgba(9, 9, 11, 0.95)',
                      '#09090B',
                    ]}
                    locations={[0, 0.35, 0.65, 0.88, 1]}
                    style={styles.bottomGradient}
                  >
                    {/* Story Info */}
                    <View style={styles.heroMeta}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handleOpenStory(story)}
                      >
                        <Text style={styles.heroTitle} numberOfLines={2}>
                          {story.title}
                        </Text>

                        <Text style={styles.heroSynopsis} numberOfLines={2}>
                          {story.synopsis}
                        </Text>
                      </TouchableOpacity>

                      {/* Action Buttons */}
                      <View style={styles.heroActionRow}>
                        <TouchableOpacity
                          activeOpacity={0.88}
                          style={styles.playButton}
                          onPress={() => handleOpenStory(story)}
                        >
                          <Ionicons name="play" size={18} color="#09090B" />
                          <Text style={styles.playButtonText}>Ouvir Agora</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.88}
                          style={styles.myListButton}
                        >
                          <Ionicons name="add" size={18} color="#FFFFFF" />
                          <Text style={styles.myListButtonText}>Minha Lista</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>

            {/* Carousel Dots */}
            {featuredStories.length > 1 && (
              <View style={styles.dotsContainer}>
                {featuredStories.map((_, dotIdx) => (
                  <View
                    key={dotIdx}
                    style={[
                      styles.dot,
                      dotIdx === activeHeroIdx && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : isLoading ? (
          <View style={[styles.heroPlaceholder, { paddingTop: insets.top + 60 }]}>
            <ActivityIndicator size="large" color="#E11D48" />
            <Text style={styles.loadingText}>Carregando destaques...</Text>
          </View>
        ) : null}

        {/* ======================================================== */}
        {/* 2. LISTAS HORIZONTAIS: APENAS A CAPA (POSTER 2:3)         */}
        {/* ======================================================== */}
        <View style={styles.railsContainer}>
          {/* Trilho 1: Em Alta / Mais Ouvidas */}
          {stories.length > 0 && (
            <HorizontalRail
              title="Em Alta no Momento"
              icon="trending-up"
              stories={stories}
              onStoryPress={handleOpenStory}
            />
          )}

          {/* Trilho 2: Terror Sobrenatural */}
          {supernaturalStories.length > 0 && (
            <HorizontalRail
              title="Terror Sobrenatural"
              icon="skull-outline"
              stories={supernaturalStories}
              onStoryPress={handleOpenStory}
            />
          )}

          {/* Trilho 3: Suspense Psicológico */}
          {psychologicalStories.length > 0 && (
            <HorizontalRail
              title="Suspense Psicológico"
              icon="eye-outline"
              stories={psychologicalStories}
              onStoryPress={handleOpenStory}
            />
          )}

          {/* Trilho 4: Horror Cósmico */}
          {cosmicStories.length > 0 && (
            <HorizontalRail
              title="Horror Cósmico & Mistério"
              icon="planet-outline"
              stories={cosmicStories}
              onStoryPress={handleOpenStory}
            />
          )}

          {/* Trilho 5: Lendas & Folclore */}
          {folkloreStories.length > 0 && (
            <HorizontalRail
              title="Lendas & Folclore Brasileiro"
              icon="moon-outline"
              stories={folkloreStories}
              onStoryPress={handleOpenStory}
            />
          )}

          {/* Trilho 6: Histórias Completas */}
          {stories.length > 1 && (
            <HorizontalRail
              title="Recomendadas para Você"
              icon="sparkles-outline"
              stories={[...stories].reverse()}
              onStoryPress={handleOpenStory}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ====================================================================
// COMPONENTE DO TRILHO HORIZONTAL (SOMENTE CAPA, SEM NENHUM TEXTO)
// ====================================================================
interface HorizontalRailProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  stories: Story[];
  onStoryPress?: (story: Story) => void;
}

function HorizontalRail({ title, icon, stories, onStoryPress }: HorizontalRailProps) {
  return (
    <View style={styles.railSection}>
      <View style={styles.railHeader}>
        <View style={styles.railTitleRow}>
          {icon && <Ionicons name={icon} size={16} color="#E11D48" style={{ marginRight: 6 }} />}
          <Text style={styles.railTitle}>{title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#71717A" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railScrollContent}
      >
        {stories.map((story) => (
          <TouchableOpacity
            key={story.id}
            activeOpacity={0.84}
            style={styles.posterCard}
            onPress={() => onStoryPress?.(story)}
          >
            {story.coverUrl ? (
              <Image
                source={{ uri: story.coverUrl }}
                style={styles.posterImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.posterFallback}>
                <Ionicons name="image-outline" size={28} color="#52525B" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ====================================================================
// ESTILOS VISUAIS (DARK THEME CINEMATOGRÁFICO - NETFLIX / HBO STYLE)
// ====================================================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140, // Espaço confortável para não colidir com o dock flutuante
  },

  // HERO SECTION
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
    backgroundColor: '#09090B',
  },
  heroSlide: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  globalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    paddingHorizontal: 20,
    zIndex: 50,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FAFAFA',
    letterSpacing: 3,
  },

  // BOTTOM CINEMATIC FADE
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 310,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 22,
    zIndex: 10,
  },
  heroMeta: {
    gap: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSynopsis: {
    fontSize: 12,
    color: '#D4D4D8',
    lineHeight: 17,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    height: 42,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#09090B',
  },
  myListButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  myListButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // CAROUSEL DOTS
  dotsContainer: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#E11D48',
  },

  heroPlaceholder: {
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#71717A',
  },

  // RAILS SECTION
  railsContainer: {
    gap: 24,
    marginTop: 6,
  },
  railSection: {
    gap: 10,
  },
  railHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  railTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  railTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: 0.2,
  },
  railScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },

  // POSTER (ONLY IMAGE - NO TEXT)
  posterCard: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C22',
  },
});
