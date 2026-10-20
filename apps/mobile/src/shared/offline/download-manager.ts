import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveAudioStreamUrl } from '../audio/audio-player-context';

export interface DownloadedEpisodeMetadata {
  episodeId: string;
  storyId: string;
  storyTitle: string;
  storyCoverUrl: string;
  episodeNumber: number;
  title: string;
  durationSeconds: number;
  audioUrl: string;
  localUri: string;
  fileSize: number; // in bytes
  downloadedAt: number;
}

const STORAGE_KEY = '@audiofic_downloaded_episodes';
const LEGACY_STORAGE_KEY = '@shortstory_downloaded_episodes';

/**
 * Retorna o diretório base para episódios baixados.
 */
export function getEpisodesDirectory(): string {
  const docDir = FileSystem.documentDirectory || '';
  return `${docDir}episodes/`;
}

/**
 * Garante que a pasta de downloads exista.
 */
export async function ensureDirectoryExists(): Promise<void> {
  const dir = getEpisodesDirectory();
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

/**
 * Obtém todos os metadados de episódios baixados salvos no AsyncStorage.
 */
export async function getDownloadedEpisodes(): Promise<
  Record<string, DownloadedEpisodeMetadata>
> {
  try {
    const raw =
      (await AsyncStorage.getItem(STORAGE_KEY)) ||
      (await AsyncStorage.getItem(LEGACY_STORAGE_KEY));
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[DownloadManager] Erro ao carregar metadados:', err);
    return {};
  }
}

/**
 * Salva o mapa de metadados no AsyncStorage.
 */
async function saveDownloadedEpisodes(
  data: Record<string, DownloadedEpisodeMetadata>,
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[DownloadManager] Erro ao salvar metadados:', err);
  }
}

/**
 * Verifica se um episódio específico está baixado e o arquivo ainda existe no disco.
 */
export async function getLocalAudioUri(
  episodeId: string,
): Promise<string | null> {
  const episodes = await getDownloadedEpisodes();
  const meta = episodes[episodeId];
  if (!meta) return null;

  try {
    const info = await FileSystem.getInfoAsync(meta.localUri);
    if (info.exists && info.size && info.size > 0) {
      return meta.localUri;
    }
    // Se o arquivo foi apagado do disco pelo SO, limpa o registro
    delete episodes[episodeId];
    await saveDownloadedEpisodes(episodes);
    return null;
  } catch {
    return null;
  }
}

// In-flight download resumables para permitir acompanhamento de progresso
const activeDownloads = new Map<string, FileSystem.DownloadResumable>();

/**
 * Inicia o download de um episódio com relatório de progresso (0 a 1).
 */
export async function downloadEpisode(
  story: { id: string; title: string; coverUrl: string },
  episode: {
    id: string;
    episodeNumber: number;
    title: string;
    durationSeconds: number;
    audioUrl: string;
  },
  onProgress?: (percentage: number) => void,
): Promise<DownloadedEpisodeMetadata> {
  await ensureDirectoryExists();

  const remoteUrl = resolveAudioStreamUrl(episode.audioUrl);
  const extension = remoteUrl.split('.').pop()?.split('?')[0] || 'mp3';
  const targetUri = `${getEpisodesDirectory()}${episode.id}.${extension}`;

  const downloadResumable = FileSystem.createDownloadResumable(
    remoteUrl,
    targetUri,
    {},
    (downloadProgress) => {
      const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;
      if (totalBytesExpectedToWrite > 0) {
        const progress = totalBytesWritten / totalBytesExpectedToWrite;
        onProgress?.(progress);
      }
    },
  );

  activeDownloads.set(episode.id, downloadResumable);

  try {
    const result = await downloadResumable.downloadAsync();
    if (!result || !result.uri) {
      throw new Error('Falha ao baixar o arquivo de áudio');
    }

    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    const fileSize = fileInfo.exists && fileInfo.size ? fileInfo.size : 0;

    const metadata: DownloadedEpisodeMetadata = {
      episodeId: episode.id,
      storyId: story.id,
      storyTitle: story.title,
      storyCoverUrl: story.coverUrl,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      durationSeconds: episode.durationSeconds,
      audioUrl: episode.audioUrl,
      localUri: result.uri,
      fileSize,
      downloadedAt: Date.now(),
    };

    const all = await getDownloadedEpisodes();
    all[episode.id] = metadata;
    await saveDownloadedEpisodes(all);

    return metadata;
  } finally {
    activeDownloads.delete(episode.id);
  }
}

/**
 * Exclui um episódio baixado do disco e dos metadados.
 */
export async function deleteEpisodeDownload(episodeId: string): Promise<void> {
  const all = await getDownloadedEpisodes();
  const meta = all[episodeId];

  if (meta && meta.localUri) {
    try {
      await FileSystem.deleteAsync(meta.localUri, { idempotent: true });
    } catch (err) {
      console.warn('[DownloadManager] Erro ao deletar arquivo local:', err);
    }
  }

  delete all[episodeId];
  await saveDownloadedEpisodes(all);
}

/**
 * Exclui todos os episódios baixados e limpa o armazenamento.
 */
export async function deleteAllDownloads(): Promise<void> {
  const dir = getEpisodesDirectory();
  try {
    await FileSystem.deleteAsync(dir, { idempotent: true });
  } catch (err) {
    console.warn('[DownloadManager] Erro ao limpar diretório de episódios:', err);
  }
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Formata bytes em texto amigável (ex: 14.2 MB).
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1000) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

/**
 * Calcula o espaço total em disco utilizado pelos downloads.
 */
export async function getTotalStorageUsed(): Promise<{
  totalBytes: number;
  formatted: string;
}> {
  const all = await getDownloadedEpisodes();
  let totalBytes = 0;
  for (const item of Object.values(all)) {
    totalBytes += item.fileSize || 0;
  }
  return {
    totalBytes,
    formatted: formatBytes(totalBytes),
  };
}
