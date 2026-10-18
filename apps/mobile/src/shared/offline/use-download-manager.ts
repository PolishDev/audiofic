import { useState, useEffect, useCallback } from 'react';
import {
  getDownloadedEpisodes,
  downloadEpisode,
  deleteEpisodeDownload,
  deleteAllDownloads,
  getTotalStorageUsed,
  type DownloadedEpisodeMetadata,
} from './download-manager';

export function useDownloadManager() {
  const [downloadedEpisodes, setDownloadedEpisodes] = useState<
    Record<string, DownloadedEpisodeMetadata>
  >({});
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});
  const [totalStorageFormatted, setTotalStorageFormatted] = useState<string>('0 MB');
  const [isLoading, setIsLoading] = useState(true);

  const refreshDownloads = useCallback(async () => {
    try {
      const episodes = await getDownloadedEpisodes();
      setDownloadedEpisodes(episodes);
      const storage = await getTotalStorageUsed();
      setTotalStorageFormatted(storage.formatted);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDownloads();
  }, [refreshDownloads]);

  const handleDownload = useCallback(
    async (
      story: { id: string; title: string; coverUrl: string },
      episode: {
        id: string;
        episodeNumber: number;
        title: string;
        durationSeconds: number;
        audioUrl: string;
      },
    ) => {
      setDownloadProgress((prev) => ({ ...prev, [episode.id]: 0.05 }));

      try {
        await downloadEpisode(story, episode, (progress) => {
          setDownloadProgress((prev) => ({
            ...prev,
            [episode.id]: Math.max(0.05, Math.min(1, progress)),
          }));
        });
        await refreshDownloads();
      } catch (err) {
        console.warn('[useDownloadManager] Falha no download:', err);
        throw err;
      } finally {
        setDownloadProgress((prev) => {
          const next = { ...prev };
          delete next[episode.id];
          return next;
        });
      }
    },
    [refreshDownloads],
  );

  const handleDelete = useCallback(
    async (episodeId: string) => {
      await deleteEpisodeDownload(episodeId);
      await refreshDownloads();
    },
    [refreshDownloads],
  );

  const handleDeleteAll = useCallback(async () => {
    await deleteAllDownloads();
    await refreshDownloads();
  }, [refreshDownloads]);

  const isDownloaded = useCallback(
    (episodeId: string) => {
      return !!downloadedEpisodes[episodeId];
    },
    [downloadedEpisodes],
  );

  const isDownloading = useCallback(
    (episodeId: string) => {
      return downloadProgress[episodeId] !== undefined;
    },
    [downloadProgress],
  );

  const getProgress = useCallback(
    (episodeId: string) => {
      return downloadProgress[episodeId] ?? 0;
    },
    [downloadProgress],
  );

  return {
    downloadedEpisodes,
    downloadProgress,
    totalStorageFormatted,
    isLoading,
    isDownloaded,
    isDownloading,
    getProgress,
    downloadEpisode: handleDownload,
    deleteDownload: handleDelete,
    deleteAllDownloads: handleDeleteAll,
    refreshDownloads,
  };
}
