import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { apiClient } from '../api/axios-client';

export interface LocalProgressItem {
  episodeId: string;
  storyId: string;
  storyTitle: string;
  storyCoverUrl: string;
  episodeNumber: number;
  episodeTitle: string;
  positionSeconds: number;
  durationSeconds: number;
  isCompleted: boolean;
  updatedAt: string; // ISO
  synced: boolean;
}

const PROGRESS_STORAGE_KEY = '@audiofic_playback_progress';
const LEGACY_PROGRESS_STORAGE_KEY = '@shortstory_playback_progress';
const LAST_PLAYED_KEY = '@audiofic_last_played';
const LEGACY_LAST_PLAYED_KEY = '@shortstory_last_played';

/**
 * Checa se o dispositivo possui conexão com a internet.
 */
export async function isDeviceOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return !!state.isConnected && state.isInternetReachable !== false;
  } catch {
    return true;
  }
}

/**
 * Carrega todos os registros de progresso salvos localmente.
 */
export async function getAllLocalProgress(): Promise<
  Record<string, LocalProgressItem>
> {
  try {
    const raw =
      (await AsyncStorage.getItem(PROGRESS_STORAGE_KEY)) ||
      (await AsyncStorage.getItem(LEGACY_PROGRESS_STORAGE_KEY));
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('[PlaybackSync] Erro ao carregar progresso local:', err);
    return {};
  }
}

/**
 * Obtém o progresso salvo de um episódio específico (do AsyncStorage e com fallback para o servidor se online).
 */
export async function getEpisodeSavedProgress(
  episodeId: string,
): Promise<number | undefined> {
  try {
    const all = await getAllLocalProgress();
    const local = all[episodeId];
    if (local && !local.isCompleted && local.positionSeconds > 5) {
      return local.positionSeconds;
    }

    // Se não tiver local ou estiver zerado, tenta obter do backend se online
    const online = await isDeviceOnline();
    if (online) {
      const res = await apiClient.get(`/playback/episode/${episodeId}`).catch(() => null);
      if (res?.data?.progress && !res.data.progress.isCompleted && res.data.progress.positionSeconds > 5) {
        return res.data.progress.positionSeconds;
      }
    }
  } catch {
    // Falha silenciosa
  }
  return undefined;
}

/**
 * Salva um item de progresso no armazenamento local e tenta sincronizar com o backend.
 */
export async function savePlaybackProgress(
  data: Omit<LocalProgressItem, 'synced'>,
): Promise<void> {
  const all = await getAllLocalProgress();
  const existing = all[data.episodeId];

  // Se já tiver um progresso local mais novo com posição maior e offline, respeitar
  const isCompleted =
    data.isCompleted ||
    (data.durationSeconds > 0 &&
      data.positionSeconds >= data.durationSeconds - 5);

  const localItem: LocalProgressItem = {
    ...data,
    isCompleted,
    synced: false,
  };

  all[data.episodeId] = localItem;

  // 1. Salvar imediatamente no disco local (AsyncStorage)
  await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(all));
  await AsyncStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(localItem));

  // 2. Se estiver online, tentar sincronizar com o servidor em tempo real
  const online = await isDeviceOnline();
  if (online) {
    try {
      await apiClient.post('/playback/progress', {
        episodeId: localItem.episodeId,
        positionSeconds: localItem.positionSeconds,
        isCompleted: localItem.isCompleted,
        updatedAt: localItem.updatedAt,
      });

      // Marca como sincronizado
      localItem.synced = true;
      all[data.episodeId] = localItem;
      await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(all));
    } catch {
      // Se falhar (ex: visitante não autenticado ou oscilação de rede), permanece synced: false
    }
  }
}

/**
 * Sincroniza todos os progressos offline acumulados com o backend quando a internet for restabelecida.
 */
export async function syncPendingOfflineProgress(): Promise<number> {
  const online = await isDeviceOnline();
  if (!online) return 0;

  const all = await getAllLocalProgress();
  const unsyncedList = Object.values(all).filter((p) => !p.synced);

  if (unsyncedList.length === 0) return 0;

  try {
    const payload = unsyncedList.map((item) => ({
      episodeId: item.episodeId,
      positionSeconds: item.positionSeconds,
      isCompleted: item.isCompleted,
      updatedAt: item.updatedAt,
    }));

    await apiClient.post('/playback/sync', { items: payload });

    // Marcar todos como sincronizados
    for (const item of unsyncedList) {
      if (all[item.episodeId]) {
        all[item.episodeId].synced = true;
      }
    }

    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(all));
    return unsyncedList.length;
  } catch (err: any) {
    // Falha silenciosa se usuário for visitante ou requisição falhar
    return 0;
  }
}

/**
 * Obtém o último episódio ouvido para continuar de onde parou.
 */
export async function getResumeEpisode(): Promise<LocalProgressItem | null> {
  let localLast: LocalProgressItem | null = null;

  try {
    const raw =
      (await AsyncStorage.getItem(LAST_PLAYED_KEY)) ||
      (await AsyncStorage.getItem(LEGACY_LAST_PLAYED_KEY));
    if (raw) {
      localLast = JSON.parse(raw);
    }
  } catch {
    // Ignorar erro
  }

  // Tenta buscar no servidor se estiver online
  const online = await isDeviceOnline();
  if (online) {
    try {
      const res = await apiClient.get('/playback/resume');
      if (res.data && res.data.resume) {
        const sResume = res.data.resume;
        const serverUpdatedAt = new Date(sResume.updatedAt).getTime();
        const localUpdatedAt = localLast
          ? new Date(localLast.updatedAt).getTime()
          : 0;

        // Se o progresso do servidor for mais recente, adotar
        if (serverUpdatedAt > localUpdatedAt && sResume.episode && sResume.story) {
          const item: LocalProgressItem = {
            episodeId: sResume.episode.id,
            storyId: sResume.story.id,
            storyTitle: sResume.story.title,
            storyCoverUrl: sResume.story.coverUrl,
            episodeNumber: sResume.episode.episodeNumber,
            episodeTitle: sResume.episode.title,
            positionSeconds: sResume.positionSeconds,
            durationSeconds: sResume.episode.durationSeconds || 0,
            isCompleted: sResume.isCompleted,
            updatedAt: sResume.updatedAt,
            synced: true,
          };

          await AsyncStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(item));
          return item;
        }
      }
    } catch {
      // Ignorar fallback
    }
  }

  return localLast;
}

/**
 * Retorna a lista de episódios em andamento para o trilho "Continuar Ouvindo".
 */
export async function getContinueListeningItems(): Promise<LocalProgressItem[]> {
  const localItems = await getAllLocalProgress();

  const inProgressLocal = Object.values(localItems)
    .filter((item) => !item.isCompleted && item.positionSeconds > 5)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const online = await isDeviceOnline();
  if (!online) {
    return inProgressLocal;
  }

  try {
    const res = await apiClient.get('/playback/continue-listening');
    if (Array.isArray(res.data) && res.data.length > 0) {
      const serverMapped: LocalProgressItem[] = res.data.map((item: any) => ({
        episodeId: item.episode.id,
        storyId: item.story.id,
        storyTitle: item.story.title,
        storyCoverUrl: item.story.coverUrl,
        episodeNumber: item.episode.episodeNumber,
        episodeTitle: item.episode.title,
        positionSeconds: item.positionSeconds,
        durationSeconds: item.episode.durationSeconds || 0,
        isCompleted: item.isCompleted,
        updatedAt: item.updatedAt,
        synced: true,
      }));

      // Mescla com dados locais priorizando timestamp mais recente
      const map = new Map<string, LocalProgressItem>();
      for (const item of serverMapped) {
        map.set(item.episodeId, item);
      }
      for (const item of inProgressLocal) {
        const existing = map.get(item.episodeId);
        if (
          !existing ||
          new Date(item.updatedAt).getTime() >
            new Date(existing.updatedAt).getTime()
        ) {
          map.set(item.episodeId, item);
        }
      }

      return Array.from(map.values()).sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }
  } catch {
    // Falha silenciosa caso offline ou não autenticado
  }

  return inProgressLocal;
}
