import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, useDownloadManager } from '@/shared';
import { apiClient } from '@/shared/api/axios-client';
import { useAudioPlayerContext } from '@/shared/audio';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 460;

export interface EpisodeItem {
  id: string;
  storyId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  synopsis?: string | null;
  durationSeconds: number;
  audioUrl: string;
  isPremium: boolean;
  playsCount?: number;
  status?: string;
}

export interface StoryDetail {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  coverUrl: string;
  thumbnailUrl?: string | null;
  author: string;
  status: string;
  isFeatured: boolean;
  viewsCount?: number;
  playsCount?: number;
  genres?: Array<{
    id: string;
    name: string;
    slug: string;
    color?: string;
    icon?: string;
  }>;
  episodes: EpisodeItem[];
}

interface StoryDetailsPageProps {
  storyId: string;
}

export function StoryDetailsPage({ storyId }: StoryDetailsPageProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavedInList, setIsSavedInList] = useState(false);

  const {
    playEpisode,
    currentEpisode: activePlayingEpisode,
    isPlaying,
  } = useAudioPlayerContext();

  const {
    isDownloaded,
    isDownloading,
    getProgress,
    downloadEpisode: startDownload,
    deleteDownload,
    deleteAllDownloads,
    totalStorageFormatted,
  } = useDownloadManager();

  const handleStartDownload = async (episode: EpisodeItem) => {
    if (!story) return;
    try {
      await startDownload(
        { id: story.id, title: story.title, coverUrl: story.coverUrl },
        episode,
      );
    } catch {
      Alert.alert(
        'Erro no Download',
        'Não foi possível baixar o áudio deste episódio. Verifique sua conexão e tente novamente.',
      );
    }
  };

  const handleConfirmDeleteDownload = (episode: EpisodeItem) => {
    Alert.alert(
      'Remover Download',
      `Deseja excluir o arquivo baixado do "EP ${episode.episodeNumber} - ${episode.title}" para liberar espaço?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteDownload(episode.id),
        },
      ],
    );
  };

  const handleManageStorage = () => {
    Alert.alert(
      'Downloads Offline',
      `Espaço total utilizado no dispositivo: ${totalStorageFormatted}.\nVocê pode ouvir episódios baixados direto do disco sem gastar dados móveis.`,
      [
        { text: 'Fechar', style: 'cancel' },
        {
          text: 'Excluir Todos os Downloads',
          style: 'destructive',
          onPress: () => deleteAllDownloads(),
        },
      ],
    );
  };

  const fetchStoryDetails = useCallback(async () => {
    try {
      setErrorMessage(null);
      const res = await apiClient.get(`/stories/${storyId}`);
      if (res.data) {
        setStory(res.data);
      }
    } catch (err: any) {
      console.warn('[StoryDetailsPage] Erro ao carregar história:', err.message);
      setErrorMessage('Não foi possível carregar os detalhes desta história.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [storyId]);

  useEffect(() => {
    fetchStoryDetails();

    // Registrar visualização no backend para telemetria e pontuação em alta
    apiClient.post(`/stories/${storyId}/view`).catch(() => {
      // Falha silenciosa de telemetria
    });
  }, [fetchStoryDetails, storyId]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchStoryDetails();
  };

  const handleShare = async () => {
    if (!story) return;
    try {
      await Share.share({
        title: story.title,
        message: `Ouça "${story.title}" no ShortStory: ${story.synopsis}`,
      });
    } catch {
      // Ignorar cancelamento
    }
  };

  const handleToggleMyList = () => {
    setIsSavedInList((prev) => !prev);
  };

  const handlePlayEpisode = (episode: EpisodeItem) => {
    if (!story) return;
    playEpisode(
      {
        id: story.id,
        title: story.title,
        coverUrl: story.coverUrl,
        author: story.author,
      },
      episode,
      story.episodes,
    );
  };

  // Formatar duração em minutos e segundos legíveis (ex: 16 min ou 12m 30s)
  const formatDuration = (totalSeconds: number): string => {
    if (!totalSeconds || totalSeconds <= 0) return '0 min';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
      return `${seconds} seg`;
    }
    if (seconds === 0) {
      return `${minutes} min`;
    }
    return `${minutes} min`;
  };

  // Carregando
  if (isLoading && !story) {
    return (
      <View style={[styles.screen, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={styles.loadingText}>Carregando história...</Text>
      </View>
    );
  }

  // Erro
  if (errorMessage && !story) {
    return (
      <View style={[styles.screen, styles.centerContainer, { paddingHorizontal: 32 }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#E11D48" />
        <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
        <Text style={styles.errorSubtitle}>{errorMessage}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.85}
          onPress={fetchStoryDetails}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backLink}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={16} color="#A1A1AA" />
          <Text style={styles.backLinkText}>Voltar ao catálogo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!story) {
    return null;
  }

  const firstEpisode = story.episodes && story.episodes.length > 0 ? story.episodes[0] : null;

  return (
    <View style={styles.screen}>
      {/* ======================================================== */}
      {/* BARRA SUPERIOR FLUTUANTE (VOLTAR & AÇÕES)                */}
      {/* ======================================================== */}
      <View
        style={[
          styles.floatingHeader,
          { paddingTop: insets.top + 8 },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.circleActionButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.rightHeaderActions}>
          <TouchableOpacity
            style={styles.circleActionButton}
            activeOpacity={0.8}
            onPress={handleToggleMyList}
            hitSlop={12}
          >
            <Ionicons
              name={isSavedInList ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSavedInList ? '#E11D48' : '#FFFFFF'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleActionButton}
            activeOpacity={0.8}
            onPress={handleShare}
            hitSlop={12}
          >
            <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#E11D48"
            colors={['#E11D48']}
          />
        }
      >
        {/* ======================================================== */}
        {/* 1. HERO CAPA IGUAL A HOME COM FADE CINEMATOGRÁFICO        */}
        {/* ======================================================== */}
        <View style={styles.heroContainer}>
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

          {/* Gradiente estilo Home / HBO / Netflix */}
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
            {/* Metadados da história */}
            <View style={styles.heroMeta}>
              {/* Tags / Gêneros */}
              <View style={styles.badgesRow}>
                {story.genres?.map((g) => (
                  <View key={g.id} style={styles.genreBadge}>
                    <Text style={styles.genreBadgeText}>{g.name}</Text>
                  </View>
                ))}
                <View style={styles.episodesCountBadge}>
                  <Text style={styles.episodesCountBadgeText}>
                    {story.episodes?.length || 0} Episódios
                  </Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>{story.title}</Text>

              {story.author && (
                <Text style={styles.authorText}>Criado por {story.author}</Text>
              )}

              <Text style={styles.heroSynopsis}>{story.synopsis}</Text>

              {/* Botões de Ação */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.primaryPlayButton}
                  onPress={() => {
                    if (firstEpisode) {
                      handlePlayEpisode(firstEpisode);
                    }
                  }}
                >
                  <Ionicons name="play" size={20} color="#09090B" />
                  <Text style={styles.primaryPlayButtonText}>
                    {activePlayingEpisode?.storyId === story.id && isPlaying
                      ? 'Reproduzindo'
                      : 'Ouvir Episódio 1'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.secondaryButton}
                  onPress={handleToggleMyList}
                >
                  <Ionicons
                    name={isSavedInList ? 'checkmark' : 'add'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.secondaryButtonText}>
                    {isSavedInList ? 'Na Minha Lista' : 'Minha Lista'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ======================================================== */}
        {/* 2. LISTA DE EPISÓDIOS                                    */}
        {/* ======================================================== */}
        <View style={styles.episodesSection}>
          <View style={styles.episodesSectionHeader}>
            <View style={styles.episodesTitleRow}>
              <Ionicons name="list" size={18} color="#E11D48" />
              <Text style={styles.episodesSectionTitle}>Episódios</Text>
            </View>

            <View style={styles.episodesHeaderRight}>
              {totalStorageFormatted !== '0 MB' && (
                <TouchableOpacity
                  style={styles.storageBadgeButton}
                  activeOpacity={0.75}
                  onPress={handleManageStorage}
                >
                  <Ionicons name="folder-outline" size={12} color="#FDA4AF" />
                  <Text style={styles.storageBadgeText}>{totalStorageFormatted}</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.seasonText}>Temporada 1</Text>
            </View>
          </View>

          {story.episodes && story.episodes.length > 0 ? (
            <View style={styles.episodesList}>
              {story.episodes.map((ep) => {
                const isCurrentlyPlaying =
                  activePlayingEpisode?.id === ep.id && isPlaying;

                return (
                  <TouchableOpacity
                    key={ep.id}
                    activeOpacity={0.8}
                    style={[
                      styles.episodeCard,
                      isCurrentlyPlaying && styles.episodeCardActive,
                    ]}
                    onPress={() => handlePlayEpisode(ep)}
                  >
                    {/* Capa do Episódio com Play Overlay */}
                    <View style={styles.episodeCoverContainer}>
                      {story.coverUrl ? (
                        <Image
                          source={{ uri: story.coverUrl }}
                          style={styles.episodeCoverImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.episodeCoverFallback}>
                          <Ionicons name="headset" size={24} color="#71717A" />
                        </View>
                      )}

                      {/* Overlay com Ícone de Play */}
                      <View style={styles.episodePlayOverlay}>
                        <Ionicons
                          name={isCurrentlyPlaying ? 'pause' : 'play'}
                          size={18}
                          color="#FFFFFF"
                        />
                      </View>
                    </View>

                    {/* Informações Centrais do Episódio */}
                    <View style={styles.episodeInfoContainer}>
                      {/* Numero do EP - Titulo do EP */}
                      <View style={styles.episodeTitleRow}>
                        <Text
                          style={[
                            styles.episodeTitle,
                            isCurrentlyPlaying && styles.episodeTitlePlaying,
                          ]}
                          numberOfLines={1}
                        >
                          EP {ep.episodeNumber} - {ep.title}
                        </Text>
                      </View>

                      {/* Embaixo do título: descrição/sinopse do EP */}
                      {ep.synopsis ? (
                        <Text style={styles.episodeSynopsis} numberOfLines={2}>
                          {ep.synopsis}
                        </Text>
                      ) : null}

                      {/* Duração do EP, Offline Badge e Badge Premium/Grátis */}
                      <View style={styles.episodeBottomMeta}>
                        <View style={styles.durationPill}>
                          <Ionicons name="time-outline" size={12} color="#A1A1AA" />
                          <Text style={styles.durationText}>
                            {formatDuration(ep.durationSeconds)}
                          </Text>
                        </View>

                        {isDownloaded(ep.id) && (
                          <View style={styles.offlineBadge}>
                            <Ionicons name="cloud-done" size={10} color="#10B981" />
                            <Text style={styles.offlineBadgeText}>BAIXADO</Text>
                          </View>
                        )}

                        {ep.isPremium ? (
                          <View style={styles.premiumBadge}>
                            <Ionicons name="lock-closed" size={10} color="#F59E0B" />
                            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                          </View>
                        ) : (
                          <View style={styles.freeBadge}>
                            <Text style={styles.freeBadgeText}>GRÁTIS</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Ação Lateral: Download e Play */}
                    <View style={styles.episodeActionContainer}>
                      {isDownloading(ep.id) ? (
                        <View style={styles.downloadProgressWrapper}>
                          <ActivityIndicator size="small" color="#E11D48" />
                          <Text style={styles.downloadProgressText}>
                            {Math.round(getProgress(ep.id) * 100)}%
                          </Text>
                        </View>
                      ) : isDownloaded(ep.id) ? (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={styles.downloadActionButton}
                          onPress={() => handleConfirmDeleteDownload(ep)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={styles.downloadActionButton}
                          onPress={() => handleStartDownload(ep)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="arrow-down-circle-outline" size={22} color="#71717A" />
                        </TouchableOpacity>
                      )}

                      <Ionicons
                        name={
                          isCurrentlyPlaying
                            ? 'radio'
                            : 'play-circle-outline'
                        }
                        size={24}
                        color={isCurrentlyPlaying ? '#E11D48' : '#71717A'}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyEpisodesContainer}>
              <Ionicons name="musical-notes-outline" size={36} color="#52525B" />
              <Text style={styles.emptyEpisodesText}>
                Nenhum episódio publicado ainda nesta história.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FAFAFA',
    marginTop: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#E11D48',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  backLinkText: {
    color: '#A1A1AA',
    fontSize: 13,
  },

  // BARRA FLUTUANTE SUPERIOR
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 9, 11, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // HERO SECTION
  heroContainer: {
    width: SCREEN_WIDTH,
    minHeight: HERO_HEIGHT,
    position: 'relative',
    backgroundColor: '#09090B',
  },
  heroImage: {
    width: '100%',
    height: HERO_HEIGHT,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 330,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  heroMeta: {
    gap: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  genreBadge: {
    backgroundColor: 'rgba(225, 29, 72, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
  },
  genreBadgeText: {
    color: '#FB7185',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  episodesCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  episodesCountBadgeText: {
    color: '#E4E4E7',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  authorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
    letterSpacing: 0.2,
  },
  heroSynopsis: {
    fontSize: 13,
    color: '#D4D4D8',
    lineHeight: 18,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  primaryPlayButton: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    height: 44,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryPlayButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#09090B',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // SEÇÃO DE EPISÓDIOS
  episodesSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  episodesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  episodesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  episodesSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: 0.2,
  },
  seasonText: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '600',
  },
  episodesList: {
    gap: 12,
  },

  // CARD DO EPISÓDIO
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    borderRadius: 14,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  episodeCardActive: {
    borderColor: 'rgba(225, 29, 72, 0.5)',
    backgroundColor: '#1C1518',
  },

  // CAPA DO EPISÓDIO
  episodeCoverContainer: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#27272A',
  },
  episodeCoverImage: {
    width: '100%',
    height: '100%',
  },
  episodeCoverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodePlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CONTEÚDO DO EPISÓDIO
  episodeInfoContainer: {
    flex: 1,
    gap: 4,
  },
  episodeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  episodeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  episodeTitlePlaying: {
    color: '#FB7185',
  },
  episodeSynopsis: {
    fontSize: 12,
    color: '#A1A1AA',
    lineHeight: 16,
  },
  episodeBottomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '500',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  freeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  freeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  offlineBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  episodesHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storageBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
  },
  storageBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FDA4AF',
  },
  episodeActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  downloadActionButton: {
    padding: 2,
  },
  downloadProgressWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  downloadProgressText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FDA4AF',
  },

  // ESTADO VAZIO
  emptyEpisodesContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyEpisodesText: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
  },
});
