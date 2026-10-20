import '../../global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary / Highlight: Spooky Purple (#7C3AED)
    primary: '#7C3AED',
    primaryForeground: '#FFFFFF',

    // Backgrounds (iOS Pure White & Secondary Grouped)
    background: '#FFFFFF',
    card: '#F2F2F7',
    backgroundElement: '#F2F2F7',
    backgroundSelected: '#E5E5EA',

    // Text & Labels
    text: '#000000',
    textSecondary: '#8E8E93',

    // Borders & Navigation
    border: '#E5E5EA',
    tint: '#7C3AED',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#7C3AED',
  },
  dark: {
    // Primary / Highlight: Spooky Purple (#7C3AED)
    primary: '#7C3AED',
    primaryForeground: '#FFFFFF',

    // Backgrounds (iOS True Black OLED & Dark Card)
    background: '#000000',
    card: '#1C1C1E',
    backgroundElement: '#1C1C1E',
    backgroundSelected: '#2C2C2E',

    // Text & Labels
    text: '#FFFFFF',
    textSecondary: '#8E8E93',

    // Borders & Navigation
    border: '#38383A',
    tint: '#7C3AED',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#7C3AED',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
} as const;

// iOS standard smooth rounded corners (squircles)
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 70 }) ?? 0;
export const MaxContentWidth = 800;
