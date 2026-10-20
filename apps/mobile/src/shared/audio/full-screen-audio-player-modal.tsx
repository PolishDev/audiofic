import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  PanResponder,
  Share,
  LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared';
import { useAudioPlayerContext } from './audio-player-context';
import { useFavorites } from '../favorites/favorites-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Proporção 1:1 para a capa
const COVER_SIZE = Math.min(SCREEN_WIDTH - 64, SCREEN_HEIGHT * 0.38);

// Formatar segundos em MM:SS ou HH:MM:SS
function formatTimestamp(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00';
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0];
const TIMER_OPTIONS = [15, 30, 45, null]; // em minutos, null = desligado

export function FullScreenAudioPlayerModal() {
  const insets = useSafeAreaInsets();
  const {
    currentStory,
    currentEpisode,
    playlist,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    isModalVisible,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    playNextEpisode,
    playPreviousEpisode,
    setPlaybackSpeed,
    closePlayerModal,
    playEpisode,
  } = useAudioPlayerContext();

  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = currentStory ? isFavorite(currentStory.id) : false;

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);

  const trackRef = useRef<View>(null);
  const trackLayoutRef = useRef<{ pageX: number; width: number }>({
    pageX: 32,
    width: SCREEN_WIDTH - 64,
  });
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const seekToRef = useRef(seekTo);
  seekToRef.current = seekTo;
  const seekTimeRef = useRef(0);
  const isSeekingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gerenciador do Sleep Timer
  useEffect(() => {
    if (timerTimeoutRef.current) {
      clearTimeout(timerTimeoutRef.current);
      timerTimeoutRef.current = null;
    }

    if (sleepTimerMinutes && sleepTimerMinutes > 0 && isPlaying) {
      timerTimeoutRef.current = setTimeout(() => {
        togglePlayPause();
        setSleepTimerMinutes(null);
      }, sleepTimerMinutes * 60 * 1000);
    }

    return () => {
      if (timerTimeoutRef.current) {
        clearTimeout(timerTimeoutRef.current);
      }
    };
  }, [sleepTimerMinutes, isPlaying, togglePlayPause]);

  useEffect(() => {
    return () => {
      if (isSeekingTimeoutRef.current) {
        clearTimeout(isSeekingTimeoutRef.current);
      }
    };
  }, []);

  const measureTrack = () => {
    trackRef.current?.measure((_x, _y, width, _height, pageX) => {
      if (width > 0) {
        trackLayoutRef.current = { pageX, width };
      }
    });
  };

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const layoutWidth = e.nativeEvent.layout.width;
    if (layoutWidth > 0) {
      trackLayoutRef.current.width = layoutWidth;
    }
    measureTrack();
  };

  const getTimeFromPageX = (touchPageX: number): number => {
    const { pageX: trackX, width: trackW } = trackLayoutRef.current;
    const totalWidth = trackW > 0 ? trackW : SCREEN_WIDTH - 64;
    const offset = touchPageX - trackX;
    const ratio = Math.max(0, Math.min(1, offset / totalWidth));
    return ratio * (durationRef.current || 0);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        if (!durationRef.current || durationRef.current <= 0) return;
        if (isSeekingTimeoutRef.current) {
          clearTimeout(isSeekingTimeoutRef.current);
        }
        setIsSeeking(true);
        measureTrack();
        const touchPageX = evt.nativeEvent.pageX ?? gestureState.x0;
        const target = getTimeFromPageX(touchPageX);
        seekTimeRef.current = target;
        setSeekTime(target);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!durationRef.current || durationRef.current <= 0) return;
        const touchPageX = evt.nativeEvent.pageX ?? gestureState.moveX;
        const target = getTimeFromPageX(touchPageX);
        seekTimeRef.current = target;
        setSeekTime(target);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!durationRef.current || durationRef.current <= 0) {
          setIsSeeking(false);
          return;
        }
        const touchPageX = evt.nativeEvent.pageX ?? gestureState.moveX;
        const target = getTimeFromPageX(touchPageX);
        seekTimeRef.current = target;
        setSeekTime(target);
        seekToRef.current(target);

        // Aguarda 150ms para desativar isSeeking, permitindo que o player nativo aplique a nova posição sem piscar de volta
        if (isSeekingTimeoutRef.current) {
          clearTimeout(isSeekingTimeoutRef.current);
        }
        isSeekingTimeoutRef.current = setTimeout(() => {
          setIsSeeking(false);
        }, 150);
      },
      onPanResponderTerminate: () => {
        if (durationRef.current && durationRef.current > 0) {
          seekToRef.current(seekTimeRef.current);
        }
        if (isSeekingTimeoutRef.current) {
          clearTimeout(isSeekingTimeoutRef.current);
        }
        isSeekingTimeoutRef.current = setTimeout(() => {
          setIsSeeking(false);
        }, 150);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const activeTime = isSeeking ? seekTime : currentTime;
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, activeTime / duration)) : 0;

  const handleCycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    setPlaybackSpeed(SPEED_OPTIONS[nextIndex]);
  };

  const handleCycleTimer = () => {
    const currentIndex = TIMER_OPTIONS.indexOf(sleepTimerMinutes);
    const nextIndex = (currentIndex + 1) % TIMER_OPTIONS.length;
    setSleepTimerMinutes(TIMER_OPTIONS[nextIndex]);
  };

  const handleShare = async () => {
    if (!currentStory || !currentEpisode) return;
    try {
      await Share.share({
        title: `${currentStory.title} - EP ${currentEpisode.episodeNumber}`,
        message: `Ouvindo agora: "${currentEpisode.title}" na série "${currentStory.title}" pelo AudioFic!`,
      });
    } catch {
      // Ignorar cancelamento
    }
  };

  if (!currentEpisode || !currentStory) {
    return null;
  }

  return (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      statusBarTranslucent
      onRequestClose={closePlayerModal}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.sheetContainer,
            {
              paddingTop: insets.top > 0 ? insets.top + 6 : 18,
              paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24,
            },
          ]}
        >
          {/* ======================================================== */}
          {/* HEADER DO BOTTOM SHEET                                   */}
          {/* ======================================================== */}
          <View style={styles.sheetHeader}>
            <TouchableOpacity
              style={styles.circleActionButton}
              activeOpacity={0.8}
              onPress={closePlayerModal}
              hitSlop={14}
            >
              <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerSubtext}>TOCANDO AGORA</Text>
              <Text style={styles.headerStoryTitle} numberOfLines={1}>
                {currentStory.title}
              </Text>
            </View>

            {/* Ícone de compartilhamento idêntico à tela de detalhes */}
            <TouchableOpacity
              style={styles.circleActionButton}
              activeOpacity={0.8}
              onPress={handleShare}
              hitSlop={14}
            >
              <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* ======================================================== */}
          {/* 1. CAPA EM 1:1 EM CIMA DA BARRA                          */}
          {/* ======================================================== */}
          <View style={styles.artworkContainer}>
            <View style={styles.artworkWrapper}>
              {currentStory.coverUrl ? (
                <Image
                  source={{ uri: currentStory.coverUrl }}
                  style={styles.artworkImage}
                  contentFit="cover"
                  priority="high"
                />
              ) : (
                <View style={styles.artworkFallback}>
                  <Ionicons name="disc-outline" size={64} color="#71717A" />
                </View>
              )}

              {/* Tag com Temporada / Ep */}
              <View style={styles.artworkBadge}>
                <Text style={styles.artworkBadgeText}>
                  T{currentEpisode.seasonNumber || 1}:EP{currentEpisode.episodeNumber}
                </Text>
              </View>
            </View>
          </View>

          {/* ======================================================== */}
          {/* 2. INFORMAÇÕES DO EPISÓDIO                              */}
          {/* ======================================================== */}
          <View style={styles.infoSection}>
            <View style={styles.infoLeft}>
              <Text style={styles.episodeTitle} numberOfLines={1}>
                EP {currentEpisode.episodeNumber} - {currentEpisode.title}
              </Text>
              <Text style={styles.storyAuthor} numberOfLines={1}>
                {currentStory.title} • {currentStory.author || 'AudioFic Originals'}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.favoriteButton,
                isFav && { backgroundColor: 'rgba(225, 29, 72, 0.18)', borderColor: 'rgba(225, 29, 72, 0.4)' },
              ]}
              hitSlop={8}
              onPress={() => {
                if (currentStory) {
                  toggleFavorite({
                    id: currentStory.id,
                    title: currentStory.title,
                  });
                }
              }}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={22}
                color={isFav ? '#E11D48' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>

          {/* ======================================================== */}
          {/* 3. BARRA DE REPRODUÇÃO (COM MINUTAGEM ATUAL E TOTAL)      */}
          {/* ======================================================== */}
          <View style={styles.scrubberSection}>
            <View
              ref={trackRef}
              style={styles.progressTouchContainer}
              onLayout={onTrackLayout}
              {...panResponder.panHandlers}
            >
              {/* Trilho de fundo */}
              <View style={styles.progressTrackBackground} pointerEvents="none" />

              {/* Trilho preenchido */}
              <View
                style={[
                  styles.progressTrackFilled,
                  { width: `${progressRatio * 100}%` },
                ]}
                pointerEvents="none"
              />

              {/* Marcador circular (Thumb) */}
              <View
                style={[
                  styles.progressThumb,
                  { left: `${Math.max(0, Math.min(100, progressRatio * 100))}%` },
                ]}
                pointerEvents="none"
              />
            </View>

            {/* Minutagem: início atual e final total */}
            <View style={styles.timestampRow}>
              <Text style={styles.timestampText}>{formatTimestamp(activeTime)}</Text>
              <Text style={styles.timestampText}>{formatTimestamp(duration)}</Text>
            </View>
          </View>

          {/* ======================================================== */}
          {/* 4. CONTROLES PRINCIPAIS: PLAY/PAUSE REDONDO E AVANÇAR/VOLTAR */}
          {/* ======================================================== */}
          <View style={styles.controlsRow}>
            {/* Episódio Anterior */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.controlSmallButton}
              onPress={playPreviousEpisode}
              hitSlop={8}
            >
              <Ionicons name="play-skip-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Voltar 15s */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.controlMediumButton}
              onPress={() => skipBackward(15)}
              hitSlop={8}
            >
              <Ionicons
                name="refresh-outline"
                size={26}
                color="#FFFFFF"
                style={styles.flipHorizontal}
              />
              <Text style={styles.skipSecText}>15</Text>
            </TouchableOpacity>

            {/* BOTÃO PLAY/PAUSE REDONDO COM ÍCONE */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.roundPlayPauseButton}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="#09090B"
                style={isPlaying ? undefined : { marginLeft: 3 }}
              />
            </TouchableOpacity>

            {/* Avançar 15s */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.controlMediumButton}
              onPress={() => skipForward(15)}
              hitSlop={8}
            >
              <Ionicons name="refresh-outline" size={26} color="#FFFFFF" />
              <Text style={styles.skipSecText}>15</Text>
            </TouchableOpacity>

            {/* Próximo Episódio */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.controlSmallButton}
              onPress={playNextEpisode}
              hitSlop={8}
            >
              <Ionicons name="play-skip-forward" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* ======================================================== */}
          {/* 5. AÇÕES SECUNDÁRIAS: TIMER - 1X - EPS (DO MESMO TAMANHO) */}
          {/* ======================================================== */}
          <View style={styles.footerActionRow}>
            {/* 1. Timer */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.equalActionButton,
                sleepTimerMinutes !== null && styles.equalActionButtonActive,
              ]}
              onPress={handleCycleTimer}
            >
              <Ionicons
                name={sleepTimerMinutes ? 'moon' : 'moon-outline'}
                size={16}
                color={sleepTimerMinutes ? '#E11D48' : '#A1A1AA'}
              />
              <Text
                style={[
                  styles.equalActionText,
                  sleepTimerMinutes !== null && styles.equalActionTextActive,
                ]}
              >
                {sleepTimerMinutes ? `${sleepTimerMinutes}m` : 'Timer'}
              </Text>
            </TouchableOpacity>

            {/* 2. 1x (Velocidade) */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.equalActionButton}
              onPress={handleCycleSpeed}
            >
              <Ionicons name="speedometer-outline" size={15} color="#A1A1AA" />
              <Text style={styles.equalActionText}>{playbackSpeed}x</Text>
            </TouchableOpacity>

            {/* 3. Eps (Episódios) */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.equalActionButton,
                showPlaylistModal && styles.equalActionButtonActive,
              ]}
              onPress={() => setShowPlaylistModal(true)}
            >
              <Ionicons
                name="list"
                size={16}
                color={showPlaylistModal ? '#E11D48' : '#A1A1AA'}
              />
              <Text
                style={[
                  styles.equalActionText,
                  showPlaylistModal && styles.equalActionTextActive,
                ]}
              >
                Eps
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================== */}
        {/* MODAL EXPANSÍVEL COMPLETO COM A LISTA DE EPISÓDIOS        */}
        {/* ======================================================== */}
        <Modal
          visible={showPlaylistModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowPlaylistModal(false)}
        >
          <View style={styles.playlistModalBackdrop}>
            <View
              style={[
                styles.playlistModalSheet,
                { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 },
              ]}
            >
              <View style={styles.playlistModalHeader}>
                <View style={styles.dragHandle} />
                <View style={styles.playlistModalTitleRow}>
                  <Text style={styles.playlistModalTitle}>
                    Episódios de {currentStory.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowPlaylistModal(false)}
                    hitSlop={10}
                    style={styles.playlistModalClose}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                style={styles.playlistScrollView}
                showsVerticalScrollIndicator={false}
              >
                {playlist.map((ep) => {
                  const isCurrent = ep.id === currentEpisode.id;

                  return (
                    <TouchableOpacity
                      key={ep.id}
                      activeOpacity={0.8}
                      style={[
                        styles.playlistRowCard,
                        isCurrent && styles.playlistRowCardCurrent,
                      ]}
                      onPress={() => {
                        playEpisode(currentStory, ep, playlist);
                        setShowPlaylistModal(false);
                      }}
                    >
                      <View style={styles.playlistRowLeft}>
                        <Ionicons
                          name={
                            isCurrent && isPlaying
                              ? 'volume-high'
                              : 'play-circle-outline'
                          }
                          size={22}
                          color={isCurrent ? '#E11D48' : '#71717A'}
                        />
                        <View style={styles.playlistRowInfo}>
                          <Text
                            style={[
                              styles.playlistRowTitle,
                              isCurrent && styles.playlistRowTitleCurrent,
                            ]}
                            numberOfLines={1}
                          >
                            EP {ep.episodeNumber} - {ep.title}
                          </Text>
                          {ep.synopsis ? (
                            <Text
                              style={styles.playlistRowSynopsis}
                              numberOfLines={1}
                            >
                              {ep.synopsis}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <Text style={styles.playlistRowDuration}>
                        {Math.floor(ep.durationSeconds / 60)} min
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#09090B',
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },

  // HEADER
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  circleActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  headerSubtext: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E11D48',
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerStoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4D4D8',
  },

  // 1:1 ARTWORK
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  artworkWrapper: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#18181B',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
    elevation: 16,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C22',
  },
  artworkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(9, 9, 11, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  artworkBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // INFO SECTION
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 4,
  },
  infoLeft: {
    flex: 1,
    paddingRight: 16,
    gap: 3,
  },
  episodeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 23,
  },
  storyAuthor: {
    fontSize: 13,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // SCRUBBER
  scrubberSection: {
    gap: 6,
    marginVertical: 8,
  },
  progressTouchContainer: {
    height: 34,
    justifyContent: 'center',
    position: 'relative',
  },
  progressTrackBackground: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
  },
  progressTrackFilled: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E11D48',
    position: 'absolute',
    left: 0,
  },
  progressThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    top: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 4,
    transform: [{ translateX: -7 }],
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // CONTROLES PRINCIPAIS
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginVertical: 8,
  },
  controlSmallButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlMediumButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  flipHorizontal: {
    transform: [{ scaleX: -1 }],
  },
  skipSecText: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    top: 15,
  },

  // BOTÃO REDONDO PLAY/PAUSE
  roundPlayPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },

  // FOOTER ACTIONS: TIMER - 1X - EPS (IGUAIS EM TAMANHO E ALINHADOS)
  footerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  equalActionButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  equalActionButtonActive: {
    backgroundColor: 'rgba(225, 29, 72, 0.18)',
    borderColor: 'rgba(225, 29, 72, 0.4)',
  },
  equalActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  equalActionTextActive: {
    color: '#FB7185',
  },

  // MODAL EXPANSÍVEL DE EPISÓDIOS
  playlistModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  playlistModalSheet: {
    backgroundColor: '#141418',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 20,
  },
  playlistModalHeader: {
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  playlistModalTitleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playlistModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  playlistModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistScrollView: {
    paddingTop: 12,
  },
  playlistRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  playlistRowCardCurrent: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
  },
  playlistRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  playlistRowInfo: {
    flex: 1,
    gap: 2,
  },
  playlistRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playlistRowTitleCurrent: {
    color: '#FB7185',
  },
  playlistRowSynopsis: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  playlistRowDuration: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
});
