import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text, useAppTheme, BottomTabInset, type ThemePreference } from '@/shared';
import type { User } from '@/features/auth';

export interface ProfilePageProps {
  user: User | null;
  isGuest: boolean;
  isLoading?: boolean;
  onLogout: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export function ProfilePage({
  user,
  isGuest,
  isLoading = false,
  onLogout,
  onDeleteAccount,
  onNavigateToLogin,
  onNavigateToRegister,
}: ProfilePageProps) {
  const { colors, isDark, themePreference, setThemePreference } = useAppTheme();
  const [isDeleting, setIsDeleting] = useState(false);

  const themeOptions: Array<{
    key: ThemePreference;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    { key: 'dark', label: 'Escuro', icon: 'moon-outline' },
    { key: 'light', label: 'Claro', icon: 'sunny-outline' },
    { key: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
  ];

  const handleConfirmLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Deseja realmente encerrar sua sessão neste dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: onLogout,
        },
      ],
    );
  };

  const handleConfirmDeleteAccount = () => {
    Alert.alert(
      'Excluir Minha Conta?',
      'Esta ação é permanente e irreversível.\n\nTodos os seus dados cadastrais, histórico de reprodução, posições sincronizadas e séries salvas na Minha Lista serão apagados definitivamente dos nossos servidores conforme as diretrizes de privacidade da App Store e Google Play.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Excluir Definitivamente',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await onDeleteAccount();
            } catch (err: any) {
              Alert.alert(
                'Falha na Exclusão',
                err?.message ||
                  'Não foi possível concluir a exclusão da sua conta. Verifique sua conexão e tente novamente.',
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading || isDeleting) {
    return (
      <SafeAreaView
        style={[
          styles.centerContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {isDeleting ? 'Excluindo sua conta e dados...' : 'Carregando perfil...'}
        </Text>
      </SafeAreaView>
    );
  }

  const subscriptionStatus = user?.subscription?.status === 'premium' ? 'Premium' : 'Gratuito';
  const planName = user?.subscription?.planName || 'Plano Gratuito';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Perfil
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Gerencie sua conta, assinatura e preferências de reprodução
          </Text>
        </View>

        {isGuest || !user ? (
          /* ======================================================== */
          /* GUEST USER VIEW                                          */
          /* ======================================================== */
          <View style={styles.sectionGap}>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.userRow}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: isDark
                        ? 'rgba(166, 43, 50, 0.2)'
                        : 'rgba(128, 0, 32, 0.1)',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    Modo Visitante
                  </Text>
                  <Text
                    style={[
                      styles.userSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Acesso aos episódios abertos do catálogo
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.cardDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Crie ou acesse sua conta gratuita para salvar seu progresso na
                nuvem, manter sua lista de histórias sincronizada e acessar
                conteúdos exclusivos.
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={onNavigateToRegister}
                >
                  <Text style={styles.primaryButtonText}>Criar Conta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.secondaryButton,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  onPress={onNavigateToLogin}
                >
                  <Text
                    style={[styles.secondaryButtonText, { color: colors.text }]}
                  >
                    Entrar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* ======================================================== */
          /* AUTHENTICATED USER VIEW                                  */
          /* ======================================================== */
          <View style={styles.sectionGap}>
            {/* User Info Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.userRow}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: colors.primary,
                      borderColor: 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {user.name}
                  </Text>
                  <Text
                    style={[
                      styles.userSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {user.email}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(166, 43, 50, 0.15)'
                          : 'rgba(128, 0, 32, 0.08)',
                        borderColor: isDark
                          ? 'rgba(166, 43, 50, 0.3)'
                          : 'rgba(128, 0, 32, 0.2)',
                      },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={12}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.statusBadgeText, { color: colors.primary }]}
                    >
                      Conta Verificada
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Subscription Status Card */}
            <View style={styles.sectionWrapper}>
              <Text
                style={[
                  styles.sectionHeaderTitle,
                  { color: colors.textSecondary },
                ]}
              >
                Assinatura & Plano
              </Text>

              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.subscriptionHeaderRow}>
                  <View style={styles.subscriptionIconTitleRow}>
                    <View
                      style={[
                        styles.subscriptionIconCircle,
                        {
                          backgroundColor: isDark
                            ? 'rgba(166, 43, 50, 0.2)'
                            : 'rgba(128, 0, 32, 0.1)',
                        },
                      ]}
                    >
                      <Ionicons
                        name="sparkles"
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.subscriptionPlanName,
                          { color: colors.text },
                        ]}
                      >
                        {planName}
                      </Text>
                      <Text
                        style={[
                          styles.subscriptionStatusSub,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Status: {subscriptionStatus}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.activePill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(52, 199, 89, 0.15)'
                          : 'rgba(52, 199, 89, 0.1)',
                        borderColor: 'rgba(52, 199, 89, 0.3)',
                      },
                    ]}
                  >
                    <Text style={styles.activePillText}>Ativo</Text>
                  </View>
                </View>

                {/* Benefits List */}
                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.benefitText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Episódios abertos com áudio de alta fidelidade
                    </Text>
                  </View>

                  <View style={styles.benefitItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.benefitText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Downloads para reprodução offline
                    </Text>
                  </View>

                  <View style={styles.benefitItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.benefitText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Sincronização de progresso e Minha Lista
                    </Text>
                  </View>
                </View>

                {/* Premium Teaser */}
                <View
                  style={[
                    styles.premiumTeaser,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(0, 0, 0, 0.02)',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.premiumTeaserHeader}>
                    <Ionicons name="star" size={16} color="#FFB800" />
                    <Text
                      style={[
                        styles.premiumTeaserTitle,
                        { color: colors.text },
                      ]}
                    >
                      AudioFic Premium (Fase 5)
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.premiumTeaserDesc,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Em breve você poderá desbloquear acesso ilimitado a todas as
                    temporadas exclusivas e novos lançamentos semanais.
                  </Text>
                </View>
              </View>
            </View>

            {/* Cloud & Data Synchronization */}
            <View style={styles.sectionWrapper}>
              <Text
                style={[
                  styles.sectionHeaderTitle,
                  { color: colors.textSecondary },
                ]}
              >
                Dados & Nuvem
              </Text>

              <View
                style={[
                  styles.settingsGroup,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.settingsRow,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View style={styles.settingsLabelRow}>
                    <Ionicons
                      name="cloud-done-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[styles.settingsLabel, { color: colors.text }]}
                    >
                      Sincronização de Progresso
                    </Text>
                  </View>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#34C759"
                  />
                </View>

                <View style={styles.settingsRow}>
                  <View style={styles.settingsLabelRow}>
                    <Ionicons
                      name="bookmark-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[styles.settingsLabel, { color: colors.text }]}
                    >
                      Minha Lista na Nuvem
                    </Text>
                  </View>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#34C759"
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* SELETOR DE TEMA (ESCURO / CLARO / SISTEMA)               */}
        {/* ======================================================== */}
        <View style={styles.sectionWrapper}>
          <Text
            style={[
              styles.sectionHeaderTitle,
              { color: colors.textSecondary },
            ]}
          >
            Aparência & Tema
          </Text>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.themeSelectorHelp,
                { color: colors.textSecondary },
              ]}
            >
              Escolha a aparência visual do aplicativo:
            </Text>

            <View
              style={[
                styles.themeSelectorContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(0, 0, 0, 0.4)'
                    : 'rgba(0, 0, 0, 0.05)',
                  borderColor: colors.border,
                },
              ]}
            >
              {themeOptions.map((opt) => {
                const isSelected = themePreference === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    activeOpacity={0.8}
                    style={[
                      styles.themeOptionButton,
                      isSelected && [
                        styles.themeOptionSelected,
                        {
                          backgroundColor: colors.card,
                          shadowColor: '#000000',
                          shadowOpacity: isDark ? 0.3 : 0.08,
                        },
                      ],
                    ]}
                    onPress={() => setThemePreference(opt.key)}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        {
                          color: isSelected ? colors.text : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* APP INFO & LEGAL                                         */}
        {/* ======================================================== */}
        <View style={styles.sectionWrapper}>
          <Text
            style={[
              styles.sectionHeaderTitle,
              { color: colors.textSecondary },
            ]}
          >
            Sobre
          </Text>

          <View
            style={[
              styles.settingsGroup,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.settingsRow,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.settingsLabelRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={[styles.settingsLabel, { color: colors.text }]}>
                  Versão do Aplicativo
                </Text>
              </View>
              <Text
                style={[
                  styles.settingsValueText,
                  { color: colors.textSecondary },
                ]}
              >
                1.0.0 (Beta)
              </Text>
            </View>

            <View style={styles.settingsRow}>
              <View style={styles.settingsLabelRow}>
                <Ionicons
                  name="shield-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={[styles.settingsLabel, { color: colors.text }]}>
                  Privacidade & Termos
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* DANGER ZONE (LOGOUT & ACCOUNT DELETION)                  */}
        {/* ======================================================== */}
        {user && !isGuest && (
          <View style={styles.sectionWrapper}>
            <Text
              style={[
                styles.sectionHeaderTitle,
                { color: colors.textSecondary },
              ]}
            >
              Ações da Conta
            </Text>

            <View style={styles.dangerActionsContainer}>
              {/* Logout Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.logoutButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleConfirmLogout}
              >
                <Ionicons
                  name="log-out-outline"
                  size={19}
                  color={colors.text}
                />
                <Text style={[styles.logoutButtonText, { color: colors.text }]}>
                  Sair da Conta
                </Text>
              </TouchableOpacity>

              {/* Account Deletion Button (Strict App Store & Google Play requirement) */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.deleteAccountButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 59, 48, 0.1)'
                      : 'rgba(255, 59, 48, 0.06)',
                    borderColor: 'rgba(255, 59, 48, 0.25)',
                  },
                ]}
                onPress={handleConfirmDeleteAccount}
              >
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                <Text style={styles.deleteAccountButtonText}>
                  Excluir Minha Conta Permanentemente
                </Text>
              </TouchableOpacity>

              <Text
                style={[
                  styles.deletionLegalDisclaimer,
                  { color: colors.textSecondary },
                ]}
              >
                Conforme as regras da Apple App Store e Google Play Store, ao
                excluir sua conta todos os seus dados, histórico e favoritos
                serão removidos imediatamente dos nossos servidores.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  sectionGap: {
    gap: 16,
  },
  sectionWrapper: {
    marginTop: 24,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  userSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  subscriptionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subscriptionIconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscriptionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionPlanName: {
    fontSize: 17,
    fontWeight: '700',
  },
  subscriptionStatusSub: {
    fontSize: 12,
    marginTop: 1,
  },
  activePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  activePillText: {
    color: '#34C759',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  benefitsList: {
    gap: 8,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
  },
  premiumTeaser: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  premiumTeaserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  premiumTeaserTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  premiumTeaserDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  settingsGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsValueText: {
    fontSize: 13,
    fontWeight: '500',
  },
  themeSelectorHelp: {
    fontSize: 13,
    marginBottom: 12,
  },
  themeSelectorContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  themeOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  themeOptionSelected: {
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  themeOptionText: {
    fontSize: 13,
  },
  dangerActionsContainer: {
    gap: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  deleteAccountButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  deletionLegalDisclaimer: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
  },
});
