import React, { useState } from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Input, InputField, InputSlot, Text, VStack } from '@/shared';
import { Colors } from '@/shared/constants/theme';

interface AuthInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export function AuthInput({
  label,
  placeholder,
  value,
  onChangeText,
  isPassword = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  error,
  leftIcon,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <VStack space="xs" className="w-full">
      <Text className="text-xs font-medium text-foreground tracking-wide ml-1">
        {label}
      </Text>

      <Input isInvalid={!!error}>
        {leftIcon && (
          <InputSlot className="pl-1 pr-2">
            <Ionicons name={leftIcon} size={18} color={colors.textSecondary} />
          </InputSlot>
        )}

        <InputField
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />

        {isPassword && (
          <InputSlot>
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={8}
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Ver senha'}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          </InputSlot>
        )}
      </Input>

      {error ? (
        <Text className="text-xs text-destructive ml-1">{error}</Text>
      ) : null}
    </VStack>
  );
}
