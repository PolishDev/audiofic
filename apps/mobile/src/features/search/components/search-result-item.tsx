import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared';
import type { SearchStory } from '../services/search-api';

interface SearchResultItemProps {
  story: SearchStory;
  onPress: (story: SearchStory) => void;
}

export function SearchResultItem({ story, onPress }: SearchResultItemProps) {
  const primaryGenre = story.genres && story.genres.length > 0 ? story.genres[0] : null;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.card}
      onPress={() => onPress(story)}
    >
      {/* Poster */}
      <View style={styles.posterWrapper}>
        {story.coverUrl ? (
          <Image
            source={{ uri: story.coverUrl }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.posterFallback}>
            <Ionicons name="image-outline" size={24} color="#52525B" />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {story.title}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#71717A" />
        </View>

        {primaryGenre && (
          <View style={styles.tagsRow}>
            <View style={styles.genreTag}>
              <Text style={styles.genreText}>{primaryGenre.name}</Text>
            </View>
            {story.author && story.author !== 'ShortStory' && (
              <Text style={styles.authorText}>por {story.author}</Text>
            )}
          </View>
        )}

        <Text style={styles.synopsis} numberOfLines={2}>
          {story.synopsis}
        </Text>

        <View style={styles.footerRow}>
          {story.episodesCount !== undefined && story.episodesCount > 0 && (
            <View style={styles.footerBadge}>
              <Ionicons name="list" size={12} color="#A1A1AA" />
              <Text style={styles.footerText}>
                {story.episodesCount} {story.episodesCount === 1 ? 'episódio' : 'episódios'}
              </Text>
            </View>
          )}

          <View style={styles.footerBadge}>
            <Ionicons name="headset-outline" size={12} color="#A1A1AA" />
            <Text style={styles.footerText}>
              {story.playsCount ?? 0} {story.playsCount === 1 ? 'play' : 'plays'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#141417',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  posterWrapper: {
    width: 68,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C22',
  },
  content: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#FAFAFA',
    marginRight: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  genreTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
  },
  genreText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FDA4AF',
  },
  authorText: {
    fontSize: 11,
    color: '#71717A',
  },
  synopsis: {
    fontSize: 12,
    color: '#A1A1AA',
    lineHeight: 16,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '500',
  },
});
