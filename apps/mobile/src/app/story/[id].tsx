import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StoryDetailsPage } from '@/features/books';

export default function StoryDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <StoryDetailsPage storyId={id} />;
}
