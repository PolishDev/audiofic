import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared';
import type { SearchStory } from '../services/search-api';

interface TopListenedItemProps {
  story: SearchStory;
  rank: number;
  onPress: (story: SearchStory) => void;
}

export function TopListenedItem({ story, rank, onPress }: TopListenedItemProps) {
  const formattedRank = rank < 10 ? `0${rank}` : `${rank}`;

  const getRankColor = () => {
    switch (rank) {
      case 1:
        return '#7C3AED'; // Spooky Purple
      case 2:
        return '#CBD5E1'; // Silver
      case 3:
        return '#F59E0B'; // Bronze
      default:
        return '#52525B'; // Muted
    }
  };

  const primaryGenre = story.genres && story.genres.length > 0 ? story.genres[0] : null;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.card}
      onPress={() => onPress(story)}
    >
      {/* Rank Indicator */}
      <View style={styles.rankContainer}>
        <Text style={[styles.rankNumber, { color: getRankColor() }]}>
          {formattedRank}
        </Text>
      </View>

      {/* Poster Thumbnail */}
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
            <Ionicons name="image-outline" size={20} color="#52525B" />
          </View>
        )}
      </View>

      {/* Metadata */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>

        <View style={styles.tagsRow}>
          {primaryGenre && (
            <Text style={styles.genreText}>{primaryGenre.name}</Text>
          )}

          {primaryGenre && story.episodesCount !== undefined && story.episodesCount > 0 && (
            <Text style={styles.dotSeparator}>•</Text>
          )}

          {story.episodesCount !== undefined && story.episodesCount > 0 && (
            <Text style={styles.metaSubtext}>
              {story.episodesCount} {story.episodesCount === 1 ? 'ep.' : 'eps.'}
            </Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <Ionicons name="headset-outline" size={13} color="#A1A1AA" />
          <Text style={styles.statsText}>
            {story.playsCount ?? 0} {story.playsCount === 1 ? 'reprodução' : 'reproduções'}
          </Text>
        </View>
      </View>

      {/* Action Play Icon */}
      <View style={styles.actionIcon}>
        <Ionicons name="play-circle-outline" size={26} color="#7C3AED" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#141417',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  posterWrapper: {
    width: 58,
    height: 80,
    borderRadius: 8,
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
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FAFAFA',
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  genreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C084FC',
  },
  dotSeparator: {
    fontSize: 12,
    color: '#52525B',
  },
  metaSubtext: {
    fontSize: 12,
    color: '#71717A',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statsText: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  actionIcon: {
    marginLeft: 10,
    padding: 4,
  },
});
