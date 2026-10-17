import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
  requestNotificationPermissionsAsync,
  type AudioPlayer,
} from 'expo-audio';
import { API_BASE_URL } from '@/shared/lib/auth-client';
import { apiClient } from '@/shared/api/axios-client';

export interface PlayerEpisode {
  id: string;
  storyId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  synopsis?: string | null;
  durationSeconds: number;
  audioUrl: string;
  isPremium: boolean;
}

export interface PlayerStory {
  id: string;
  title: string;
  coverUrl: string;
  author?: string;
}

interface AudioPlayerContextType {
  // State
  currentStory: PlayerStory | null;
  currentEpisode: PlayerEpisode | null;
  playlist: PlayerEpisode[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  playbackSpeed: number;
  isModalVisible: boolean;
  hasAudio: boolean;

  // Actions
  playEpisode: (
    story: PlayerStory,
    episode: PlayerEpisode,
    episodeList?: PlayerEpisode[],
  ) => Promise<void>;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  playNextEpisode: () => void;
  playPreviousEpisode: () => void;
  setPlaybackSpeed: (speed: number) => void;
  openPlayerModal: () => void;
  closePlayerModal: () => void;
  togglePlayerModal: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

/**
 * Resolve relative or absolute audio URLs to reachable network streams
 */
export function resolveAudioStreamUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentStory, setCurrentStory] = useState<PlayerStory | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<PlayerEpisode | null>(null);
  const [playlist, setPlaylist] = useState<PlayerEpisode[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [playbackSpeed, setSpeedState] = useState(1.0);
  const [activeAudioUri, setActiveAudioUri] = useState<string | null>(null);

  // Instanciar o reprodutor nativo do expo-audio com taxa de atualização de 250ms
  const player = useAudioPlayer(activeAudioUri, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const isConfiguredRef = useRef(false);

  // 1. Configurar o modo de áudio nativo para reprodução em segundo plano e tela de bloqueio
  useEffect(() => {
    async function configureAudioSession() {
      if (isConfiguredRef.current) return;
      isConfiguredRef.current = true;

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'doNotMix',
          shouldPlayInBackground: true,
        });

        if (Platform.OS === 'android') {
          await requestNotificationPermissionsAsync().catch(() => {});
        }
      } catch (err) {
        console.warn('[AudioPlayer] Falha ao configurar sessão de áudio nativa:', err);
      }
    }

    configureAudioSession();
  }, []);

  // 2. Sincronizar os controles de tela de bloqueio, Notificações e Dynamic Island / Now Bar
  useEffect(() => {
    if (!player || !currentEpisode || !currentStory || !activeAudioUri) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        player.setActiveForLockScreen(
          true,
          {
            title: `EP ${currentEpisode.episodeNumber} - ${currentEpisode.title}`,
            artist: currentStory.title,
            albumTitle: currentStory.title,
            artworkUrl: currentStory.coverUrl,
          },
          {
            showSeekBackward: true,
            showSeekForward: true,
          },
        );
      } catch (err) {
        // Falha tolerante caso o serviço nativo ainda esteja inicializando
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [player, currentEpisode, currentStory, activeAudioUri]);

  // Iniciar reprodução de um episódio específico
  const playEpisode = useCallback(
    async (
      story: PlayerStory,
      episode: PlayerEpisode,
      episodeList: PlayerEpisode[] = [],
    ) => {
      setCurrentStory(story);
      setCurrentEpisode(episode);
      setPlaylist(episodeList.length > 0 ? episodeList : [episode]);

      const streamUrl = resolveAudioStreamUrl(episode.audioUrl);
      setActiveAudioUri(streamUrl);

      // Abrir o bottom sheet do player automaticamente de baixo para cima
      setIsModalVisible(true);

      // Disparar telemetria no servidor
      apiClient.post(`/episodes/${episode.id}/play`).catch(() => {});

      // Substituir e tocar a fonte no player
      if (player) {
        try {
          player.replace({ uri: streamUrl });
          player.play();
        } catch (err) {
          console.warn('[AudioPlayer] Erro ao iniciar áudio:', err);
        }
      }
    },
    [player],
  );

  // Play / Pause
  const togglePlayPause = useCallback(() => {
    if (!player) return;
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, status.playing]);

  // Avançar / retroceder para um tempo específico
  const seekTo = useCallback(
    (seconds: number) => {
      if (!player) return;
      const target = Math.max(0, Math.min(seconds, status.duration || 0));
      player.seekTo(target);
    },
    [player, status.duration],
  );

  // Pular 15 segundos para frente
  const skipForward = useCallback(
    (seconds = 15) => {
      if (!player) return;
      const newTime = Math.min((status.currentTime || 0) + seconds, status.duration || 0);
      player.seekTo(newTime);
    },
    [player, status.currentTime, status.duration],
  );

  // Pular 15 segundos para trás
  const skipBackward = useCallback(
    (seconds = 15) => {
      if (!player) return;
      const newTime = Math.max((status.currentTime || 0) - seconds, 0);
      player.seekTo(newTime);
    },
    [player, status.currentTime],
  );

  // Próximo episódio na fila
  const playNextEpisode = useCallback(() => {
    if (!currentEpisode || playlist.length === 0 || !currentStory) return;
    const currentIndex = playlist.findIndex((ep) => ep.id === currentEpisode.id);
    if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
      const nextEp = playlist[currentIndex + 1];
      playEpisode(currentStory, nextEp, playlist);
    }
  }, [currentEpisode, playlist, currentStory, playEpisode]);

  // Episódio anterior na fila
  const playPreviousEpisode = useCallback(() => {
    if (!currentEpisode || playlist.length === 0 || !currentStory) return;
    const currentIndex = playlist.findIndex((ep) => ep.id === currentEpisode.id);
    if (currentIndex > 0) {
      const prevEp = playlist[currentIndex - 1];
      playEpisode(currentStory, prevEp, playlist);
    } else {
      // Se for o primeiro episódio, reinicia do começo
      seekTo(0);
    }
  }, [currentEpisode, playlist, currentStory, playEpisode, seekTo]);

  // Velocidade de reprodução (1.0x, 1.25x, 1.5x, 2.0x)
  const setPlaybackSpeed = useCallback(
    (speed: number) => {
      if (!player) return;
      setSpeedState(speed);
      player.setPlaybackRate(speed);
    },
    [player],
  );

  const openPlayerModal = useCallback(() => setIsModalVisible(true), []);
  const closePlayerModal = useCallback(() => setIsModalVisible(false), []);
  const togglePlayerModal = useCallback(
    () => setIsModalVisible((prev) => !prev),
    [],
  );

  // Se o áudio finalizou, passar para o próximo se houver
  useEffect(() => {
    if (status.duration > 0 && status.currentTime >= status.duration - 0.5) {
      playNextEpisode();
    }
  }, [status.currentTime, status.duration, playNextEpisode]);

  const value: AudioPlayerContextType = {
    currentStory,
    currentEpisode,
    playlist,
    isPlaying: !!status.playing,
    currentTime: status.currentTime || 0,
    duration: status.duration || currentEpisode?.durationSeconds || 0,
    isBuffering: !!status.isBuffering,
    playbackSpeed,
    isModalVisible,
    hasAudio: !!currentEpisode && !!activeAudioUri,
    playEpisode,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    playNextEpisode,
    playPreviousEpisode,
    setPlaybackSpeed,
    openPlayerModal,
    closePlayerModal,
    togglePlayerModal,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayerContext() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error(
      'useAudioPlayerContext deve ser usado dentro de um AudioPlayerProvider',
    );
  }
  return context;
}
