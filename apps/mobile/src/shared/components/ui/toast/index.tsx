'use client';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Pressable,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text, HStack, VStack } from '@/shared';
import { Colors } from '@/shared/constants/theme';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  show: (options: ToastOptions) => void;
  error: (title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastItem extends ToastOptions {
  id: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -24,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentToast(null);
    });
  }, [opacity, translateY]);

  const show = useCallback(
    ({ title, message, type = 'info', duration = 4000 }: ToastOptions) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setCurrentToast({
        id: Date.now(),
        title,
        message,
        type,
        duration,
      });

      opacity.setValue(0);
      translateY.setValue(-24);

      Animated.parallel([
        Animated.spring(opacity, {
          toValue: 1,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(() => {
        hide();
      }, duration);
    },
    [hide, opacity, translateY],
  );

  const error = useCallback(
    (title: string, message?: string) => {
      show({ title, message, type: 'error' });
    },
    [show],
  );

  const success = useCallback(
    (title: string, message?: string) => {
      show({ title, message, type: 'success' });
    },
    [show],
  );

  const info = useCallback(
    (title: string, message?: string) => {
      show({ title, message, type: 'info' });
    },
    [show],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getIconInfo = (type: ToastType) => {
    switch (type) {
      case 'error':
        return {
          name: 'alert-circle' as const,
          color: colors.primary,
          bg: colorScheme === 'dark' ? 'rgba(166, 43, 50, 0.2)' : 'rgba(128, 0, 32, 0.1)',
        };
      case 'success':
        return {
          name: 'checkmark-circle' as const,
          color: '#34C759',
          bg: colorScheme === 'dark' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.1)',
        };
      case 'info':
      default:
        return {
          name: 'information-circle' as const,
          color: '#007AFF',
          bg: colorScheme === 'dark' ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ show, error, success, info, hide }}>
      {children}
      {currentToast && (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 16,
            right: 16,
            zIndex: 99999,
            opacity,
            transform: [{ translateY }],
          }}>
          <Pressable
            onPress={hide}
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: colorScheme === 'dark' ? 0.35 : 0.12,
              shadowRadius: 12,
              elevation: 8,
            }}>
            <HStack className="items-center justify-between">
              <HStack className="items-center flex-1 gap-3">
                {(() => {
                  const iconInfo = getIconInfo(currentToast.type ?? 'info');
                  return (
                    <View
                      style={{
                        backgroundColor: iconInfo.bg,
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Ionicons
                        name={iconInfo.name}
                        size={20}
                        color={iconInfo.color}
                      />
                    </View>
                  );
                })()}

                <VStack className="flex-1 pr-2">
                  <Text className="text-sm font-bold text-foreground leading-tight">
                    {currentToast.title}
                  </Text>
                  {currentToast.message ? (
                    <Text className="text-xs text-muted-foreground leading-snug mt-0.5">
                      {currentToast.message}
                    </Text>
                  ) : null}
                </VStack>
              </HStack>

              <Pressable
                onPress={hide}
                hitSlop={8}
                className="w-6 h-6 items-center justify-center rounded-full opacity-60">
                <Ionicons
                  name="close"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
            </HStack>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}
