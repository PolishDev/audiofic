import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getApiBaseUrl = (): string => {
  // 1. Explicit environment variable takes highest priority
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Extract host IP from Expo dev server if available
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri && typeof hostUri === 'string') {
    const ip = hostUri.split(':')[0];
    // Avoid localhost or loopback if running on a real mobile device
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3001`;
    }
  }

  // 3. Fallback for local physical Wi-Fi network
  // Default to the computer's LAN IPv4 address
  const LOCAL_LAN_IP = '192.168.0.13';

  // Android emulator can reach the host via 10.0.2.2
  // But physical devices must use the local network IP
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:3001';
  }

  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return `http://${LOCAL_LAN_IP}:3001`;
  }

  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();
console.log('[AuthClient] Configured API_BASE_URL:', API_BASE_URL);

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    expoClient({
      scheme: 'shortstory',
      storagePrefix: 'shortstory',
      storage: SecureStore,
    }),
  ],
});
