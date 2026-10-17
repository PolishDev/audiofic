import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Text } from '@/shared';
import { Colors } from '@/shared/constants/theme';
import { useColorScheme } from 'react-native';

interface AuthHeaderProps {
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
}

export function AuthHeader({ title, onBack, showBack = true }: AuthHeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <HStack className="w-full items-center justify-between py-3 mb-4">
      {showBack && onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          className="w-10 h-10 rounded-full bg-card items-center justify-center border border-border"
          accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
      ) : (
        <Box className="w-10 h-10" />
      )}

      {title ? (
        <Text className="text-base font-semibold text-foreground">{title}</Text>
      ) : (
        <HStack className="items-center gap-1.5">
          <Ionicons name="headset" size={20} color={colors.primary} />
          <Text className="text-lg font-bold tracking-tight text-foreground">
            Short<Text className="text-primary">Story</Text>
          </Text>
        </HStack>
      )}

      <Box className="w-10 h-10" />
    </HStack>
  );
}
