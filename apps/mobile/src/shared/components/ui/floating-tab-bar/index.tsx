'use client';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/shared/constants/theme';

export interface FloatingGlassTabBarProps {
  state: {
    index: number;
    routes: Array<{
      key: string;
      name: string;
      params?: any;
    }>;
  };
  descriptors: Record<string, any>;
  navigation: any;
  insets?: any;
}

// Direct reliable icon mapping for each route to prevent any icon disappearance on tab switch
const TAB_ICONS: Record<
  string,
  {
    focused: keyof typeof Ionicons.glyphMap;
    unfocused: keyof typeof Ionicons.glyphMap;
  }
> = {
  books: { focused: 'book', unfocused: 'book-outline' },
  buscar: { focused: 'search', unfocused: 'search-outline' },
  listas: { focused: 'bookmark', unfocused: 'bookmark-outline' },
  perfil: { focused: 'person', unfocused: 'person-outline' },
};

export function FloatingGlassTabBar({
  state,
  descriptors,
  navigation,
}: FloatingGlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  // Safe bottom offset so the floating pill is elevated comfortably above the bottom edge
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 24 : 36;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outerContainer,
        {
          bottom: bottomOffset,
        },
      ]}>
      {/* Shadow wrapper for the floating pill */}
      <View
        style={[
          styles.shadowContainer,
          {
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.55 : 0.16,
          },
        ]}>
        {/* Liquid Glass Pill Body */}
        <View
          style={[
            styles.glassPill,
            {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.22)'
                : 'rgba(255, 255, 255, 0.65)',
            },
          ]}>
          {/* Frosted Blur Backdrop */}
          <BlurView
            intensity={isDark ? 80 : 70}
            tint={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 29 }]}
          />

          {/* Liquid Glass Translucent Surface Tint */}
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 29,
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.13)'
                  : 'rgba(255, 255, 255, 0.70)',
              },
            ]}
          />

          {/* Liquid Glass Specular Top Highlight (Primary Reflection) */}
          <View
            pointerEvents="none"
            style={[
              styles.specularTop,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.40)'
                  : 'rgba(255, 255, 255, 0.90)',
              },
            ]}
          />

          {/* Liquid Glass Specular Bottom Rim (Secondary Reflection) */}
          <View
            pointerEvents="none"
            style={[
              styles.specularBottom,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(255, 255, 255, 0.40)',
              },
            ]}
          />

          {/* Tabs Row (No text labels, icons only) */}
          <View collapsable={false} style={styles.tabsRow}>
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const { options } = descriptors[route.key];

              // Skip screens configured with tabBarItemStyle: { display: 'none' }
              if (options?.tabBarItemStyle?.display === 'none') {
                return null;
              }

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate({ name: route.name, merge: true });
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              const iconConfig = TAB_ICONS[route.name] || {
                focused: 'ellipse',
                unfocused: 'ellipse-outline',
              };
              const iconName = isFocused
                ? iconConfig.focused
                : iconConfig.unfocused;
              const iconColor = isFocused
                ? '#FFFFFF'
                : isDark
                  ? '#A1A1AA'
                  : '#71717A';
              const iconSize = 22;

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options?.title ?? route.name}
                  hitSlop={8}
                  collapsable={false}
                  style={styles.tabButton}>
                  <View
                    collapsable={false}
                    style={[
                      styles.iconPill,
                      isFocused && {
                        backgroundColor: colors.primary,
                      },
                    ]}>
                    <Ionicons
                      name={iconName}
                      size={iconSize}
                      color={iconColor}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 32,
    right: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  shadowContainer: {
    width: '100%',
    maxWidth: 280,
    height: 58,
    borderRadius: 29,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  glassPill: {
    flex: 1,
    borderRadius: 29,
    overflow: 'hidden',
    borderWidth: 1.2,
    position: 'relative',
    justifyContent: 'center',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    height: '100%',
    width: '100%',
    zIndex: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconPill: {
    width: 48,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specularTop: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    borderRadius: 1,
    zIndex: 1,
  },
  specularBottom: {
    position: 'absolute',
    bottom: 0,
    left: 28,
    right: 28,
    height: 0.8,
    borderRadius: 0.5,
    zIndex: 1,
  },
});
