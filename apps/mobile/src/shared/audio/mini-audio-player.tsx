import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared';
import { useAudioPlayerContext } from './audio-player-context';

export function MiniAudioPlayer() {
  const insets = useSafeAreaInsets();
  const {
    currentStory,
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    hasAudio,
    isModalVisible,
    togglePlayPause,
    openPlayerModal,
  } = useAudioPlayerContext();

  // Se não houver áudio ou se o modal full-screen estiver aberto, oculta
  if (!hasAudio || !currentEpisode || !currentStory || isModalVisible) {
    return null;
  }

  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  // Elevação alinhada com o dock flutuante (BottomOffset do dock = insets.bottom + 24 + altura do dock 58 + margem 12)
  const bottomOffset = (insets.bottom > 0 ? insets.bottom + 24 : 36) + 68;

  return (
    <View
      style={[styles.outerContainer, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={styles.shadowContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.glassPill}
          onPress={openPlayerModal}
        >
          {/* Frosted Blur Backdrop */}
          <BlurView
            intensity={85}
            tint="dark"
            style={[StyleSheet.absoluteFill, { borderRadius: 29 }]}
          />

          {/* Liquid Glass Translucent Surface Tint */}
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 29,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
              },
            ]}
          />

          {/* Liquid Glass Specular Top Highlight (mesmo estilo do dock) */}
          <View pointerEvents="none" style={styles.specularTop} />

          {/* Linha fina de progresso no topo do pill */}
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFilled, { width: `${progress * 100}%` }]}
            />
          </View>

          {/* Conteúdo interno alinhado */}
          <View style={styles.contentRow}>
            {/* Capa miniatura */}
            <View style={styles.thumbnailContainer}>
              {currentStory.coverUrl ? (
                <Image
                  source={{ uri: currentStory.coverUrl }}
                  style={styles.thumbnailImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.thumbnailFallback}>
                  <Ionicons name="headset" size={14} color="#A1A1AA" />
                </View>
              )}
            </View>

            {/* Textos: EP e Título */}
            <View style={styles.textContainer}>
              <Text style={styles.episodeText} numberOfLines={1}>
                EP {currentEpisode.episodeNumber} - {currentEpisode.title}
              </Text>
              <Text style={styles.storyText} numberOfLines={1}>
                {currentStory.title}
              </Text>
            </View>

            {/* Botão Play/Pause redondo */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.playButton}
              onPress={togglePlayPause}
              hitSlop={8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={16}
                color="#FFFFFF"
                style={isPlaying ? undefined : { marginLeft: 2 }}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 32,
    right: 32,
    zIndex: 950,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowContainer: {
    width: '100%',
    maxWidth: 280, // Largura idêntica à FloatingGlassTabBar
    height: 52,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 8,
  },
  glassPill: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    position: 'relative',
    justifyContent: 'center',
  },
  specularTop: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    zIndex: 1,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFilled: {
    height: '100%',
    backgroundColor: '#E11D48',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
    height: '100%',
  },
  thumbnailContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1C1C22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 1,
  },
  episodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storyText: {
    fontSize: 10,
    color: '#A1A1AA',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
});
