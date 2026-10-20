import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'shortstory_theme_preference';

interface ThemeContextType {
  themePreference: ThemePreference;
  effectiveTheme: 'light' | 'dark';
  isDark: boolean;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme() ?? 'dark';
  const { setColorScheme: setNativeWindColorScheme } = useNativeWindColorScheme();
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedPref) => {
        if (
          isMounted &&
          savedPref &&
          (savedPref === 'light' || savedPref === 'dark' || savedPref === 'system')
        ) {
          setThemePreferenceState(savedPref as ThemePreference);
          setNativeWindColorScheme(savedPref as ThemePreference);
        } else if (isMounted) {
          // Default to system or dark
          setThemePreferenceState('dark');
          setNativeWindColorScheme('dark');
        }
      })
      .catch(() => {
        // Fallback silently
      })
      .finally(() => {
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [setNativeWindColorScheme]);

  const setThemePreference = async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    setNativeWindColorScheme(pref);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch (err) {
      console.warn('[ThemeContext] Falha ao persistir preferência de tema:', err);
    }
  };

  const effectiveTheme: 'light' | 'dark' = useMemo(() => {
    if (themePreference === 'system') {
      return deviceColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themePreference;
  }, [themePreference, deviceColorScheme]);

  const isDark = effectiveTheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const value = useMemo(
    () => ({
      themePreference,
      effectiveTheme,
      isDark,
      colors,
      setThemePreference,
    }),
    [themePreference, effectiveTheme, isDark, colors],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme deve ser utilizado dentro de um ThemeProvider');
  }
  return context;
}
