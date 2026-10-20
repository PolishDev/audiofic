import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/shared/auth/auth-context';
import { Colors } from '@/shared/constants/theme';
import { useColorScheme } from 'react-native';

import { SpookyMascot } from '@/shared/components/mascot';

export default function IndexRoute() {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}>
        <SpookyMascot pose="listening" size={150} animated />
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // If already authenticated or chose guest mode, enter the app directly
  if (isAuthenticated || isGuest) {
    return <Redirect href="/(app)/books" />;
  }

  // Otherwise, present the onboarding screen
  return <Redirect href="/(auth)/onboarding" />;
}
