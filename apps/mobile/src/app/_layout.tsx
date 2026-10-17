import '../global.css';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GluestackUIProvider } from '@/shared/components/ui/gluestack-ui-provider';
import { Colors } from '@/shared/constants/theme';
import { AuthProvider } from '@/shared/auth/auth-context';
import {
  AudioPlayerProvider,
  FullScreenAudioPlayerModal,
  MiniAudioPlayer,
} from '@/shared/audio';

import { ToastProvider } from '@/shared/components/ui/toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: isDark ? Colors.dark.primary : Colors.light.primary,
      background: isDark ? Colors.dark.background : Colors.light.background,
      card: isDark ? Colors.dark.card : Colors.light.card,
      text: isDark ? Colors.dark.text : Colors.light.text,
      border: isDark ? Colors.dark.border : Colors.light.border,
    },
  };

  return (
    <GluestackUIProvider mode={isDark ? 'dark' : 'light'}>
      <ThemeProvider value={navigationTheme}>
        <ToastProvider>
          <AuthProvider>
            <AudioPlayerProvider>
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
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
