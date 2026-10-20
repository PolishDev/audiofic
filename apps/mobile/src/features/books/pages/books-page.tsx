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
import { Text, getContinueListeningItems, type LocalProgressItem, useFavorites } from '@/shared';
import { apiClient } from '@/shared/api/axios-client';
import { useAudioPlayerContext } from '@/shared/audio';

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
  const { isFavorite, toggleFavorite } = useFavorites();
  const [stories, setStories] = useState<Story[]>([]);
  const [continueListeningList, setContinueListeningList] = useState<LocalProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const heroScrollRef = useRef<ScrollView>(null);
  const { playEpisode } = useAudioPlayerContext();

  const handleOpenStory = (targetStory: Story) => {
    router.push({
      pathname: '/story/[id]',
      params: { id: targetStory.id },
    });
  };

  const handleResumeEpisode = (item: LocalProgressItem) => {
    playEpisode(
      {
        id: item.storyId,
        title: item.storyTitle,
        coverUrl: item.storyCoverUrl,
      },
      {
        id: item.episodeId,
        storyId: item.storyId,
        seasonNumber: 1,
        episodeNumber: item.episodeNumber,
        title: item.episodeTitle,
        durationSeconds: item.durationSeconds,
        audioUrl: '',
        isPremium: false,
      },
      [],
      item.positionSeconds,
    );
  };

  const fetchStories = useCallback(async () => {
    try {
      const [storiesRes, continueItems] = await Promise.all([
        apiClient.get('/stories').catch(() => null),
        getContinueListeningItems().catch(() => []),
      ]);

      if (storiesRes?.data && Array.isArray(storiesRes.data.data)) {
        setStories(storiesRes.data.data);
      }
      setContinueListeningList(continueItems || []);
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
            <Ionicons name="headset" size={18} color="#7C3AED" />
            <Text style={styles.brandText}>AUDIOFIC</Text>
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
            tintColor="#7C3AED"
            colors={['#7C3AED']}
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
              {featuredStories.map((story) => {
                const isSaved = isFavorite(story.id);

                return (
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
                            style={[
                              styles.myListButton,
                              isSaved && styles.myListButtonActive,
                            ]}
                            onPress={() =>
                              toggleFavorite({
                                id: story.id,
                                title: story.title,
                              })
                            }
                          >
                            <Ionicons
                              name={isSaved ? 'checkmark' : 'add'}
                              size={18}
                              color={isSaved ? '#C084FC' : '#FFFFFF'}
                            />
                            <Text
                              style={[
                                styles.myListButtonText,
                                isSaved && styles.myListButtonTextActive,
                              ]}
                            >
                              {isSaved ? 'Na Lista' : 'Minha Lista'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                );
              })}
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
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Carregando destaques...</Text>
          </View>
        ) : null}

        {/* ======================================================== */}
        {/* 2. TRILHO "CONTINUAR OUVINDO" DESTACADO NO TOPO          */}
        {/* ======================================================== */}
        {continueListeningList.length > 0 && (
          <View style={styles.continueSection}>
            <View style={styles.railHeader}>
              <View style={styles.railTitleRow}>
                <Ionicons name="play-circle" size={17} color="#7C3AED" style={{ marginRight: 6 }} />
                <Text style={styles.railTitle}>Continuar Ouvindo</Text>
              </View>
              <Text style={styles.continueCountText}>
                {continueListeningList.length} em andamento
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.continueScrollContent}
            >
              {continueListeningList.map((item) => {
                const total = item.durationSeconds || item.positionSeconds || 1;
                const percent = Math.min(
                  100,
                  Math.max(5, Math.round((item.positionSeconds / total) * 100)),
                );
                const currentMin = Math.floor(item.positionSeconds / 60);
                const totalMin = Math.floor((item.durationSeconds || 0) / 60);

                return (
                  <TouchableOpacity
                    key={item.episodeId}
                    activeOpacity={0.85}
                    style={styles.continueCard}
                    onPress={() => handleResumeEpisode(item)}
                  >
                    {/* Poster miniatura com overlay */}
                    <View style={styles.continuePosterWrapper}>
                      {item.storyCoverUrl ? (
                        <Image
                          source={{ uri: item.storyCoverUrl }}
                          style={styles.continuePosterImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.continuePosterFallback}>
                          <Ionicons name="headset" size={18} color="#71717A" />
                        </View>
                      )}
                      <View style={styles.continuePlayOverlay}>
                        <Ionicons name="play" size={14} color="#FFFFFF" />
                      </View>
                    </View>

                    {/* Metadados e barra de progresso */}
                    <View style={styles.continueMeta}>
                      <Text style={styles.continueStoryTitle} numberOfLines={1}>
                        {item.storyTitle}
                      </Text>
                      <Text style={styles.continueEpisodeTitle} numberOfLines={1}>
                        EP {item.episodeNumber} - {item.episodeTitle}
                      </Text>

                      {/* Barra de Progresso */}
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${percent}%` },
                          ]}
                        />
                      </View>

                      <View style={styles.progressTimeRow}>
                        <Text style={styles.progressTimeText}>
                          {currentMin > 0 ? `${currentMin} min` : `${item.positionSeconds}s`} de {totalMin > 0 ? `${totalMin} min` : 'fim'}
                        </Text>
                        <Text style={styles.continueActionText}>Retomar</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ======================================================== */}
        {/* 3. LISTAS HORIZONTAIS: APENAS A CAPA (POSTER 2:3)         */}
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
          {icon && <Ionicons name={icon} size={16} color="#7C3AED" style={{ marginRight: 6 }} />}
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
  myListButtonActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    borderColor: '#7C3AED',
  },
  myListButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  myListButtonTextActive: {
    color: '#E9D5FF',
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
    backgroundColor: '#7C3AED',
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

  // CONTINUAR OUVINDO
  continueSection: {
    marginTop: 18,
    marginBottom: 6,
    gap: 12,
  },
  continueCountText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  continueScrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  continueCard: {
    flexDirection: 'row',
    width: SCREEN_WIDTH - 40,
    backgroundColor: '#141418',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    padding: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  continuePosterWrapper: {
    width: 62,
    height: 78,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1E24',
  },
  continuePosterImage: {
    width: '100%',
    height: '100%',
  },
  continuePosterFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continuePlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueMeta: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  continueStoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  continueEpisodeTitle: {
    fontSize: 12,
    color: '#D4D4D8',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  progressTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressTimeText: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '500',
  },
  continueActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C084FC',
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
