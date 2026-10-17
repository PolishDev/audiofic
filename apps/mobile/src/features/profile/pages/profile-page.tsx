import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Box, Button, ButtonText, HStack, Text, VStack } from '@/shared';
import { Colors } from '@/shared/constants/theme';
import type { User } from '@/features/auth';

export interface ProfilePageProps {
  user: User | null;
  isGuest: boolean;
  isLoading?: boolean;
  onLogout: () => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export function ProfilePage({
  user,
  isGuest,
  isLoading = false,
  onLogout,
  onNavigateToLogin,
  onNavigateToRegister,
}: ProfilePageProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        className="px-6 py-4">
        {/* Header */}
        <VStack space="xs" className="mt-2 mb-6">
          <Text className="text-3xl font-bold text-foreground">Perfil</Text>
          <Text className="text-sm text-muted-foreground">
            Gerencie sua conta e preferências de reprodução
          </Text>
        </VStack>

        {isGuest || !user ? (
          /* Guest Banner */
          <VStack space="md">
            <View className="p-5 bg-card rounded-2xl border border-border">
              <HStack className="items-center gap-3 mb-3">
                <View
                  style={{ backgroundColor: colors.background }}
                  className="w-12 h-12 rounded-full items-center justify-center border border-border">
                  <Ionicons
                    name="person-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <VStack space="xs" className="flex-1">
                  <Text className="text-base font-bold text-foreground">
                    Modo Visitante (Gratuito)
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Você pode ouvir os episódios abertos normalmente.
                  </Text>
                </VStack>
              </HStack>

              <Text className="text-xs text-muted-foreground leading-relaxed mb-4">
                Crie ou acesse sua conta para salvar seu progresso na nuvem,
                manter seu histórico sincronizado e desbloquear episódios
                exclusivos.
              </Text>

              <HStack space="sm" className="w-full">
                <Button
                  onPress={onNavigateToRegister}
                  style={{ backgroundColor: colors.primary }}
                  className="flex-1 h-11 rounded-xl items-center justify-center">
                  <ButtonText className="text-sm font-semibold text-white">
                    Cadastrar
                  </ButtonText>
                </Button>

                <Button
                  onPress={onNavigateToLogin}
                  variant="outline"
                  className="flex-1 h-11 rounded-xl border-border bg-background items-center justify-center">
                  <ButtonText className="text-sm font-semibold text-foreground">
                    Entrar
                  </ButtonText>
                </Button>
              </HStack>
            </View>

            {/* General Preferences Group */}
            <VStack space="xs" className="mt-4">
              <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 mb-1">
                Preferências de Áudio
              </Text>

              <View className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                <View className="flex-row items-center justify-between p-4">
                  <HStack className="items-center gap-3">
                    <Ionicons
                      name="speedometer-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text className="text-sm text-foreground">
                      Velocidade Padrão
                    </Text>
                  </HStack>
                  <Text className="text-sm font-medium text-muted-foreground">
                    1.0x
                  </Text>
                </View>

                <View className="flex-row items-center justify-between p-4 border-t border-border">
                  <HStack className="items-center gap-3">
                    <Ionicons
                      name="cloud-download-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text className="text-sm text-foreground">
                      Download Automático
                    </Text>
                  </HStack>
                  <Text className="text-sm font-medium text-muted-foreground">
                    Apenas Wi-Fi
                  </Text>
                </View>
              </View>
            </VStack>
          </VStack>
        ) : (
          /* Authenticated User View */
          <VStack space="md">
            <View className="p-5 bg-card rounded-2xl border border-border">
              <HStack className="items-center gap-4 mb-2">
                <View
                  style={{ backgroundColor: colors.primary }}
                  className="w-14 h-14 rounded-full items-center justify-center shadow-sm">
                  <Text className="text-xl font-bold text-white">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>

                <VStack space="xs" className="flex-1">
                  <Text className="text-lg font-bold text-foreground">
                    {user.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {user.email}
                  </Text>
                  <View className="self-start px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 mt-1">
                    <Text
                      style={{ color: colors.primary }}
                      className="text-[10px] font-semibold tracking-wide uppercase">
                      Conta Gratuita
                    </Text>
                  </View>
                </VStack>
              </HStack>
            </View>

            {/* Account Settings Group */}
            <VStack space="xs" className="mt-4">
              <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 mb-1">
                Conta & Dados
              </Text>

              <View className="bg-card rounded-2xl border border-border overflow-hidden">
                <View className="flex-row items-center justify-between p-4 border-b border-border">
                  <HStack className="items-center gap-3">
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text className="text-sm text-foreground">
                      Status da Conta
                    </Text>
                  </HStack>
                  <Text className="text-sm font-medium text-muted-foreground">
                    Ativa
                  </Text>
                </View>

                <View className="flex-row items-center justify-between p-4">
                  <HStack className="items-center gap-3">
                    <Ionicons
                      name="sync-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text className="text-sm text-foreground">
                      Sincronização na Nuvem
                    </Text>
                  </HStack>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.primary}
                  />
                </View>
              </View>
            </VStack>

            {/* Logout Button */}
            <Button
              onPress={onLogout}
              variant="outline"
              className="w-full h-12 rounded-2xl border-destructive/30 bg-destructive/5 items-center justify-center mt-6">
              <HStack className="items-center gap-2">
                <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
                <ButtonText className="text-sm font-semibold text-destructive">
                  Sair da Conta
                </ButtonText>
              </HStack>
            </Button>
          </VStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
