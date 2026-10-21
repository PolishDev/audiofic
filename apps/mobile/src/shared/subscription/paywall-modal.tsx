import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared';
import { useAppTheme } from '@/shared/theme';
import { useSubscription } from './subscription-context';

export function PaywallModal() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const {
    isPaywallVisible,
    paywallContext,
    closePaywall,
    purchasePlan,
    restoreUserPurchases,
    annualPackage,
    monthlyPackage,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isPaywallVisible) {
    return null;
  }

  const isDailyLimit = paywallContext?.reason === 'daily_limit';
  const isPremiumEpisode = paywallContext?.reason === 'premium_episode';
  const isOfflineDownload = paywallContext?.reason === 'offline_download';

  const annualPriceString = annualPackage?.product?.priceString || 'R$ 178,80';
  const monthlyPriceString = monthlyPackage?.product?.priceString || 'R$ 19,90';

  const handleSubscribe = async () => {
    try {
      setIsProcessing(true);
      const res = await purchasePlan(selectedPlan);

      if (res.userCancelled) {
        return;
      }

      if (res.success) {
        Alert.alert(
          'Bem-vindo ao AudioFic PRO! 🎧',
          'Sua assinatura foi ativada com sucesso. Aproveite episódios ilimitados e temporadas completas!',
          [
            {
              text: 'Começar a Ouvir',
              onPress: closePaywall,
            },
          ],
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Falha na Assinatura',
        err?.message || 'Não foi possível concluir a transação. Tente novamente.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsProcessing(true);
      const result = await restoreUserPurchases();

      if (result.isPro) {
        Alert.alert(
          'Assinatura Restaurada!',
          'Seu acesso AudioFic PRO foi restaurado com sucesso.',
          [{ text: 'OK', onPress: closePaywall }],
        );
      } else {
        Alert.alert(
          'Nenhuma Assinatura Ativa',
          'Não encontramos compras ou assinaturas ativas vinculadas a esta conta da Google Play Store.',
          [{ text: 'OK' }],
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={isPaywallVisible}
      animationType="slide"
      transparent
      onRequestClose={closePaywall}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#121216' : '#FFFFFF',
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Header Close Button */}
          <View style={styles.headerBar}>
            <View style={styles.proPillBadge}>
              <Ionicons name="sparkles" size={14} color="#C084FC" />
              <Text style={styles.proPillText}>AUDIOFIC PRO</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
              onPress={closePaywall}
              hitSlop={12}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Title & Subtitle based on Context */}
            <View style={styles.titleSection}>
              <Text style={[styles.mainTitle, { color: colors.text }]}>
                {isDailyLimit
                  ? 'Limite diário de 3 episódios atingido'
                  : isPremiumEpisode
                  ? 'Desbloqueie este episódio'
                  : isOfflineDownload
                  ? 'Baixe episódios para ouvir offline'
                  : 'Ouça sem interrupções'}
              </Text>

              <Text style={[styles.mainSubtitle, { color: colors.textSecondary }]}>
                {isDailyLimit
                  ? 'Você já aproveitou seus 3 episódios gratuitos de hoje! Assine o PRO para continuar maratonando agora sem esperar até amanhã.'
                  : isPremiumEpisode
                  ? 'Este episódio faz parte das temporadas completas exclusivas para assinantes AudioFic PRO.'
                  : isOfflineDownload
                  ? 'Baixar episódios para ouvir sem internet e sem gastar seus dados móveis é um recurso exclusivo para assinantes AudioFic PRO.'
                  : 'Tenha acesso ilimitado a todas as séries de terror, suspense e mistério do catálogo.'}
              </Text>
            </View>

            {/* Benefits List */}
            <View
              style={[
                styles.benefitsCard,
                {
                  backgroundColor: isDark ? 'rgba(124, 58, 237, 0.08)' : 'rgba(124, 58, 237, 0.05)',
                  borderColor: 'rgba(124, 58, 237, 0.2)',
                },
              ]}
            >
              <View style={styles.benefitRow}>
                <Ionicons name="infinite" size={20} color="#7C3AED" />
                <View style={styles.benefitTextContainer}>
                  <Text style={[styles.benefitTitle, { color: colors.text }]}>
                    Episódios Ilimitados
                  </Text>
                  <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                    Ouça quantos episódios quiser sem limite diário de 3/dia.
                  </Text>
                </View>
              </View>

              <View style={styles.benefitRow}>
                <Ionicons name="lock-open-outline" size={20} color="#7C3AED" />
                <View style={styles.benefitTextContainer}>
                  <Text style={[styles.benefitTitle, { color: colors.text }]}>
                    Temporadas Completas Exclusivas
                  </Text>
                  <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                    Desbloqueie todos os episódios premium e lançamentos semanais.
                  </Text>
                </View>
              </View>

              <View style={styles.benefitRow}>
                <Ionicons name="cloud-download-outline" size={20} color="#7C3AED" />
                <View style={styles.benefitTextContainer}>
                  <Text style={[styles.benefitTitle, { color: colors.text }]}>
                    Downloads Offline
                  </Text>
                  <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                    Baixe e ouça quando estiver sem conexão com áudio de alta fidelidade.
                  </Text>
                </View>
              </View>
            </View>

            {/* Plan Cards */}
            <View style={styles.plansContainer}>
              {/* Annual Plan (Featured) */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.planCard,
                  selectedPlan === 'annual'
                    ? [styles.planCardSelected, { borderColor: '#7C3AED' }]
                    : [styles.planCardUnselected, { borderColor: colors.border }],
                  { backgroundColor: isDark ? '#1A1A22' : '#F9FAFB' },
                ]}
                onPress={() => setSelectedPlan('annual')}
              >
                <View style={styles.planBadgeDiscount}>
                  <Text style={styles.planBadgeDiscountText}>ECONOMIZE 25%</Text>
                </View>

                <View style={styles.planRow}>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planTitle, { color: colors.text }]}>
                      Plano Anual
                    </Text>
                    <Text style={[styles.planSub, { color: colors.textSecondary }]}>
                      {annualPriceString} cobrado anualmente
                    </Text>
                  </View>

                  <View style={styles.planPriceCol}>
                    <Text style={[styles.planPriceMonthly, { color: colors.text }]}>
                      R$ 14,90
                    </Text>
                    <Text style={[styles.planPricePeriod, { color: colors.textSecondary }]}>
                      /mês
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Monthly Plan */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly'
                    ? [styles.planCardSelected, { borderColor: '#7C3AED' }]
                    : [styles.planCardUnselected, { borderColor: colors.border }],
                  { backgroundColor: isDark ? '#1A1A22' : '#F9FAFB' },
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <View style={styles.planRow}>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planTitle, { color: colors.text }]}>
                      Plano Mensal
                    </Text>
                    <Text style={[styles.planSub, { color: colors.textSecondary }]}>
                      Cancele a qualquer momento
                    </Text>
                  </View>

                  <View style={styles.planPriceCol}>
                    <Text style={[styles.planPriceMonthly, { color: colors.text }]}>
                      {monthlyPriceString}
                    </Text>
                    <Text style={[styles.planPricePeriod, { color: colors.textSecondary }]}>
                      /mês
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Subscribe Action Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.subscribeButton, { backgroundColor: '#7C3AED' }]}
              onPress={handleSubscribe}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {selectedPlan === 'annual'
                    ? 'Assinar Plano Anual • R$ 14,90/mês'
                    : `Assinar Plano Mensal • ${monthlyPriceString}/mês`}
                </Text>
              )}
            </TouchableOpacity>

            {/* Secondary Option: Dismiss / Wait */}
            {isDailyLimit && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.waitButton}
                onPress={closePaywall}
              >
                <Text style={[styles.waitButtonText, { color: colors.textSecondary }]}>
                  Esperar até amanhã às 00:00
                </Text>
              </TouchableOpacity>
            )}

            {/* Legal Links */}
            <View style={styles.legalRow}>
              <TouchableOpacity onPress={handleRestorePurchases}>
                <Text style={[styles.legalText, { color: colors.textSecondary }]}>
                  Restaurar Compras
                </Text>
              </TouchableOpacity>
              <Text style={[styles.legalDot, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.legalText, { color: colors.textSecondary }]}>
                Termos & Privacidade
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  proPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  proPillText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  titleSection: {
    marginTop: 8,
    marginBottom: 18,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  benefitsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  plansContainer: {
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  planCardSelected: {
    borderWidth: 2,
  },
  planCardUnselected: {
    borderWidth: 1,
  },
  planBadgeDiscount: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planBadgeDiscountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  planSub: {
    fontSize: 12,
  },
  planPriceCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  planPriceMonthly: {
    fontSize: 18,
    fontWeight: '800',
  },
  planPricePeriod: {
    fontSize: 12,
  },
  subscribeButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  waitButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  waitButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  legalText: {
    fontSize: 11,
  },
  legalDot: {
    fontSize: 11,
  },
});
