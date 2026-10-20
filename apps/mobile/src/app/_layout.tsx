import '../global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GluestackUIProvider } from '@/shared/components/ui/gluestack-ui-provider';
import { AuthProvider } from '@/shared/auth/auth-context';
import { FavoritesProvider } from '@/shared/favorites/favorites-context';
import {
  AudioPlayerProvider,
  FullScreenAudioPlayerModal,
  MiniAudioPlayer,
} from '@/shared/audio';
import { ToastProvider } from '@/shared/components/ui/toast';
import { ThemeProvider, useAppTheme } from '@/shared/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigationContent() {
  const { isDark, colors, effectiveTheme } = useAppTheme();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <GluestackUIProvider mode={effectiveTheme}>
      <NavigationThemeProvider value={navigationTheme}>
        <ToastProvider>
          <AuthProvider>
            <FavoritesProvider>
              <AudioPlayerProvider>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(app)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="story/[id]"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                </Stack>
                <MiniAudioPlayer />
                <FullScreenAudioPlayerModal />
              </AudioPlayerProvider>
            </FavoritesProvider>
          </AuthProvider>
        </ToastProvider>
      </NavigationThemeProvider>
    </GluestackUIProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigationContent />
    </ThemeProvider>
  );
}
