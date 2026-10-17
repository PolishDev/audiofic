import React from 'react';
import { ScrollView, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Box, Button, ButtonText, HStack, Text, VStack } from '@/shared';
import { Colors } from '@/shared/constants/theme';

export interface OnboardingPageProps {
  onLogin: () => void;
  onRegister: () => void;
  onContinueAsGuest: () => void;
}

export function OnboardingPage({
  onLogin,
  onRegister,
  onContinueAsGuest,
}: OnboardingPageProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="px-6 py-4">
        {/* Top Branding */}
        <VStack space="sm" className="items-center mt-6">
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 4,
            }}>
            <Ionicons name="headset" size={38} color={colors.primary} />
          </View>

          <HStack className="items-center gap-1.5 mt-3">
            <Text className="text-3xl font-extrabold tracking-tight text-foreground">
              Short<Text style={{ color: colors.primary }}>Story</Text>
            </Text>
          </HStack>

          <View className="px-3 py-1 rounded-full bg-card border border-border mt-1">
            <Text className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Terror • Suspense • Mistério
            </Text>
          </View>
        </VStack>

        {/* Hero Narrative Pitch */}
        <VStack space="md" className="items-center text-center mt-8 px-2">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Histórias sombrias narradas para prender sua atenção.
          </Text>
          <Text className="text-sm text-muted-foreground text-center leading-relaxed max-w-xs">
            Episódios curtos e envolventes em áudio ficcional. Ouça enquanto se
            desloca, relaxa ou antes de dormir.
          </Text>
        </VStack>

        {/* Feature Highlights Cards */}
        <VStack space="sm" className="mt-8">
          <View className="flex-row items-center p-3.5 bg-card rounded-2xl border border-border">
            <View
              style={{ backgroundColor: colors.background }}
              className="w-10 h-10 rounded-xl items-center justify-center mr-3 border border-border">
              <Ionicons name="flash-outline" size={20} color={colors.primary} />
            </View>
            <VStack space="xs" className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                Episódios de 10 a 15 minutos
              </Text>
              <Text className="text-xs text-muted-foreground">
                Narrativas ágeis perfeitas para pausas e trajetos diários.
              </Text>
            </VStack>
          </View>

          <View className="flex-row items-center p-3.5 bg-card rounded-2xl border border-border">
            <View
              style={{ backgroundColor: colors.background }}
              className="w-10 h-10 rounded-xl items-center justify-center mr-3 border border-border">
              <Ionicons name="moon-outline" size={20} color={colors.primary} />
            </View>
            <VStack space="xs" className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                Ganchos e suspense contínuo
              </Text>
              <Text className="text-xs text-muted-foreground">
                Séries originais com revelações que instigam o próximo capítulo.
              </Text>
            </VStack>
          </View>

          <View className="flex-row items-center p-3.5 bg-card rounded-2xl border border-border">
            <View
              style={{ backgroundColor: colors.background }}
              className="w-10 h-10 rounded-xl items-center justify-center mr-3 border border-border">
              <Ionicons name="play-outline" size={20} color={colors.primary} />
            </View>
            <VStack space="xs" className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                Comece sem barreiras
              </Text>
              <Text className="text-xs text-muted-foreground">
                Ouça episódios gratuitos imediatamente, sem necessidade de cadastro.
              </Text>
            </VStack>
          </View>
        </VStack>

        {/* Bottom Actions */}
        <VStack space="sm" className="mt-auto pt-8 pb-4">
          <Button
            onPress={onRegister}
            className="w-full h-13 rounded-2xl shadow-sm items-center justify-center"
            style={{ backgroundColor: colors.primary }}>
            <ButtonText className="text-base font-semibold text-white">
              Criar Conta Gratuita
            </ButtonText>
          </Button>

          <Button
            onPress={onLogin}
            variant="outline"
            className="w-full h-13 rounded-2xl border-border bg-card items-center justify-center">
            <ButtonText className="text-base font-semibold text-foreground">
              Já tenho conta • Entrar
            </ButtonText>
          </Button>

          <Button
            onPress={onContinueAsGuest}
            variant="ghost"
            className="w-full h-11 items-center justify-center mt-1">
            <HStack className="items-center gap-1.5">
              <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
              <ButtonText className="text-sm font-medium text-muted-foreground">
                Continuar sem Login (Ouvir Grátis)
              </ButtonText>
            </HStack>
          </Button>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
