import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
  requestNotificationPermissionsAsync,
  type AudioPlayer,
} from 'expo-audio';
import { API_BASE_URL } from '@/shared/lib/auth-client';
import { apiClient } from '@/shared/api/axios-client';
import { useAuth } from '@/shared/auth/auth-context';
import { useSubscription } from '@/shared/subscription/subscription-context';
import { getLocalAudioUri } from '../offline/download-manager';
import {
  savePlaybackProgress,
  syncPendingOfflineProgress,
  getAllLocalProgress,
  getEpisodeSavedProgress,
} from '../playback/playback-sync-manager';

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
    initialPositionSeconds?: number,
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
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { requestEpisodeAccess } = useSubscription();

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

  const pendingSeekRef = useRef<number | null>(null);
  const pendingPlayRef = useRef<boolean>(false);

  // Monitorar carregamento e status do player para aplicar seek pendente e garantir autoplay
  useEffect(() => {
    if (!player) return;

    // Se temos um seek pendente e o player carregou duração ou tempo válido
    if (pendingSeekRef.current !== null && (status.isLoaded || status.duration > 0)) {
      const targetSec = pendingSeekRef.current;
      pendingSeekRef.current = null;
      try {
        player.seekTo(targetSec);
      } catch (err) {
        console.warn('[AudioPlayer] Erro no seekTo:', err);
      }
    }

    // Se foi solicitado play ao trocar de episódio mas o player ainda não está tocando
    if (pendingPlayRef.current && (status.isLoaded || status.duration > 0 || !status.playing)) {
      try {
        player.play();
        if (status.playing) {
          pendingPlayRef.current = false;
        }
      } catch (err) {
        console.warn('[AudioPlayer] Erro ao disparar player.play():', err);
      }
    }
  }, [player, status.isLoaded, status.duration, status.playing]);

  // Iniciar reprodução de um episódio específico
  const playEpisode = useCallback(
    async (
      story: PlayerStory,
      episode: PlayerEpisode,
      episodeList: PlayerEpisode[] = [],
      initialPositionSeconds?: number,
    ) => {
      // 0. Autenticação obrigatória para reprodução e cota diária
      if (isGuest || !user) {
        Alert.alert(
          'Faça login para ouvir',
          'Crie ou acesse sua conta gratuita para ouvir os episódios do dia e salvar seu progresso.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Entrar / Cadastrar',
              onPress: () => router.push('/(auth)/login'),
            },
          ],
        );
        return;
      }

      // 1. Validar autorização no servidor (cota diária de 3 episódios e status PRO)
      let resolvedAudioUrl = episode.audioUrl;
      try {
        const access = await requestEpisodeAccess(episode.id);
        if (!access.authorized) {
          return;
        }
        if (access.audioUrl) {
          resolvedAudioUrl = access.audioUrl;
        }
      } catch {
        // Erros de cota (DAILY_LIMIT_EXCEEDED) e episódios PRO (PREMIUM_SUBSCRIPTION_REQUIRED)
        // já disparam automaticamente o PaywallModal via SubscriptionContext
        return;
      }

      setCurrentStory(story);
      setCurrentEpisode(episode);
      setPlaylist(episodeList.length > 0 ? episodeList : [episode]);

      // 2. Reprodução Inteligente: Toca local do disco se baixado, senão toca URL remota
      const localUri = await getLocalAudioUri(episode.id);
      const streamUrl = localUri || resolveAudioStreamUrl(resolvedAudioUrl);
      setActiveAudioUri(streamUrl);

      // 3. Determinar ponto de início (passado explicitamente ou salvo no storage local / backend)
      let startPos = initialPositionSeconds;
      if (startPos === undefined) {
        startPos = await getEpisodeSavedProgress(episode.id);
      }

      // Configurar seek pendente e autoplay
      if (startPos && startPos > 0) {
        pendingSeekRef.current = startPos;
      } else {
        pendingSeekRef.current = null;
      }
      pendingPlayRef.current = true;

      // Abrir o bottom sheet do player automaticamente de baixo para cima
      setIsModalVisible(true);

      // Disparar telemetria no servidor
      apiClient.post(`/episodes/${episode.id}/play`).catch(() => {});

      // Substituir a fonte e disparar play imediatamente
      if (player) {
        try {
          player.replace({ uri: streamUrl });
          if (startPos && startPos > 0) {
            player.seekTo(startPos).catch(() => {});
          }
          player.play();

          // Retentativa defensiva para garantir que o player nativo inicie a reprodução
          setTimeout(() => {
            try {
              if (startPos && startPos > 0 && Math.abs((player.currentTime || 0) - startPos) > 3) {
                player.seekTo(startPos);
              }
              player.play();
            } catch {}
          }, 350);
        } catch (err) {
          console.warn('[AudioPlayer] Erro ao iniciar áudio:', err);
        }
      }
    },
    [player, isGuest, user, requestEpisodeAccess, router],
  );

  // Play / Pause com salvamento de progresso imediato ao pausar
  const togglePlayPause = useCallback(() => {
    if (!player) return;
    if (status.playing) {
      if (currentStory && currentEpisode && (status.duration || 0) > 0) {
        savePlaybackProgress({
          episodeId: currentEpisode.id,
          storyId: currentStory.id,
          storyTitle: currentStory.title,
          storyCoverUrl: currentStory.coverUrl,
          episodeNumber: currentEpisode.episodeNumber,
          episodeTitle: currentEpisode.title,
          positionSeconds: Math.floor(status.currentTime || 0),
          durationSeconds: Math.floor(status.duration || currentEpisode.durationSeconds || 0),
          isCompleted: (status.currentTime || 0) >= (status.duration - 5),
          updatedAt: new Date().toISOString(),
        });
      }
      player.pause();
    } else {
      player.play();
    }
  }, [player, status.playing, currentStory, currentEpisode, status.currentTime, status.duration]);

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

  // Salvar progresso a cada 15 segundos enquanto reproduz
  useEffect(() => {
    if (!status.playing || !currentStory || !currentEpisode || !(status.duration || 0)) {
      return;
    }

    const interval = setInterval(() => {
      const currentSec = Math.floor(status.currentTime || 0);
      const totalSec = Math.floor(status.duration || currentEpisode.durationSeconds || 0);
      if (currentSec > 0 && totalSec > 0) {
        savePlaybackProgress({
          episodeId: currentEpisode.id,
          storyId: currentStory.id,
          storyTitle: currentStory.title,
          storyCoverUrl: currentStory.coverUrl,
          episodeNumber: currentEpisode.episodeNumber,
          episodeTitle: currentEpisode.title,
          positionSeconds: currentSec,
          durationSeconds: totalSec,
          isCompleted: currentSec >= totalSec - 5,
          updatedAt: new Date().toISOString(),
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [status.playing, currentStory, currentEpisode, status.currentTime, status.duration]);

  // Se o áudio finalizou, marcar como concluído no progresso e passar para o próximo
  useEffect(() => {
    if (status.duration > 0 && status.currentTime >= status.duration - 0.5) {
      if (currentStory && currentEpisode) {
        savePlaybackProgress({
          episodeId: currentEpisode.id,
          storyId: currentStory.id,
          storyTitle: currentStory.title,
          storyCoverUrl: currentStory.coverUrl,
          episodeNumber: currentEpisode.episodeNumber,
          episodeTitle: currentEpisode.title,
          positionSeconds: Math.floor(status.duration),
          durationSeconds: Math.floor(status.duration),
          isCompleted: true,
          updatedAt: new Date().toISOString(),
        });
      }
      playNextEpisode();
    }
  }, [status.currentTime, status.duration, playNextEpisode, currentStory, currentEpisode]);

  // Sincronizar pendências offline ao carregar o aplicativo ou periodicamente
  useEffect(() => {
    syncPendingOfflineProgress();

    const syncInterval = setInterval(() => {
      syncPendingOfflineProgress();
    }, 30000);

    return () => clearInterval(syncInterval);
  }, []);

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
