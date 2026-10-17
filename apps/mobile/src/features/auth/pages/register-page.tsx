import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Button, ButtonText, HStack, Text, VStack } from '@/shared';
import { Colors } from '@/shared/constants/theme';
import { AuthHeader } from '../components/auth-header';
import { AuthInput } from '../components/auth-input';
import type { RegisterFormData } from '../types';

export interface RegisterPageProps {
  onRegister: (data: RegisterFormData) => Promise<void>;
  onNavigateToLogin: () => void;
  onContinueAsGuest: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function RegisterPage({
  onRegister,
  onNavigateToLogin,
  onContinueAsGuest,
  onBack,
  isLoading = false,
}: RegisterPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const validate = (): boolean => {
    const errors: { name?: string; email?: string; password?: string } = {};

    if (!name.trim()) {
      errors.name = 'Informe seu nome';
    } else if (name.trim().length < 2) {
      errors.name = 'O nome deve ter pelo menos 2 caracteres';
    }

    if (!email.trim()) {
      errors.email = 'Informe o seu email';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errors.email = 'Email inválido';
    }

    if (!password) {
      errors.password = 'Informe sua senha';
    } else if (password.length < 8) {
      errors.password = 'A senha deve ter pelo menos 8 caracteres';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isLoading) return;
    await onRegister({ name, email, password });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="px-6">
          <AuthHeader onBack={onBack} showBack={!!onBack} />

          {/* Title and Subtitle */}
          <VStack space="xs" className="mt-2 mb-6">
            <Text className="text-3xl font-bold text-foreground">
              Crie sua conta
            </Text>
            <Text className="text-sm text-muted-foreground">
              Acompanhe séries de terror e suspense, salve favoritos e continue de
              onde parou em qualquer dispositivo.
            </Text>
          </VStack>



          {/* Form */}
          <VStack space="md" className="w-full">
            <AuthInput
              label="Nome completo"
              placeholder="Como quer ser chamado"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (fieldErrors.name) {
                  setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              autoCapitalize="words"
              autoCorrect={false}
              leftIcon="person-outline"
              error={fieldErrors.name}
            />

            <AuthInput
              label="E-mail"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail-outline"
              error={fieldErrors.email}
            />

            <AuthInput
              label="Senha"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              isPassword
              leftIcon="lock-closed-outline"
              error={fieldErrors.password}
            />

            <Button
              onPress={handleSubmit}
              disabled={isLoading}
              style={{ backgroundColor: colors.primary }}
              className="w-full h-13 rounded-2xl items-center justify-center mt-3 shadow-sm">
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ButtonText className="text-base font-semibold text-white">
                  Cadastrar
                </ButtonText>
              )}
            </Button>
          </VStack>

          {/* Guest and Divider */}
          <VStack space="sm" className="items-center mt-8">
            <HStack className="items-center w-full justify-center">
              <View className="flex-1 h-[1px] bg-border" />
              <Text className="text-xs text-muted-foreground px-3">ou</Text>
              <View className="flex-1 h-[1px] bg-border" />
            </HStack>

            <Button
              onPress={onContinueAsGuest}
              variant="outline"
              className="w-full h-12 rounded-2xl border-border bg-card items-center justify-center mt-2">
              <ButtonText className="text-sm font-semibold text-foreground">
                Continuar sem Login
              </ButtonText>
            </Button>
          </VStack>

          {/* Footer Login Link */}
          <HStack className="justify-center items-center mt-auto py-6 gap-1">
            <Text className="text-sm text-muted-foreground">
              Já tem uma conta?
            </Text>
            <Pressable onPress={onNavigateToLogin} hitSlop={8}>
              <Text
                style={{ color: colors.primary }}
                className="text-sm font-semibold">
                Entre
              </Text>
            </Pressable>
          </HStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
