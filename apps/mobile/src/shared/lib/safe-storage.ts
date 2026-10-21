import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch {}
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch {}
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },

  async getItemAsync(key: string): Promise<string | null> {
    return this.getItem(key);
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    return this.setItem(key, value);
  },

  async deleteItemAsync(key: string): Promise<void> {
    return this.deleteItem(key);
  },
};
