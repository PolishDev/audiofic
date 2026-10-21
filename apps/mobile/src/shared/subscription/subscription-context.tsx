import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type { PurchasesPackage, PurchasesOfferings } from 'react-native-purchases';
import { apiClient } from '@/shared/api/axios-client';
import { useAuth } from '@/shared/auth/auth-context';
import {
  initializePurchases,
  identifyUser,
  resetPurchasesUser,
  fetchOfferings,
  purchasePackage,
  restorePurchases,
  hasProEntitlement,
} from './purchases-client';

export type PaywallReason = 'daily_limit' | 'premium_episode' | 'manual';

export interface PaywallContextData {
  reason: PaywallReason;
  resetAt?: string | null;
  remainingCount?: number;
}

export interface DailyQuotaData {
  isUnlimited: boolean;
  dailyLimit: number | null;
  usedCount: number;
  remainingCount: number | null;
  resetAt: string | null;
  listenedEpisodeIds: string[];
}

export interface AccessResult {
  authorized: boolean;
  audioUrl?: string;
  isUnlimited?: boolean;
  dailyLimit?: number;
  remainingCount?: number | null;
  resetAt?: string | null;
}

interface SubscriptionContextType {
  isPro: boolean;
  isPaywallVisible: boolean;
  paywallContext: PaywallContextData | null;
  dailyQuota: DailyQuotaData | null;
  isLoadingQuota: boolean;
  offerings: PurchasesOfferings | null;
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
  openPaywall: (data?: Partial<PaywallContextData>) => void;
  closePaywall: () => void;
  refreshDailyQuota: () => Promise<void>;
  requestEpisodeAccess: (episodeId: string) => Promise<AccessResult>;
  purchasePlan: (planType: 'annual' | 'monthly') => Promise<{ success: boolean; userCancelled?: boolean }>;
  restoreUserPurchases: () => Promise<{ success: boolean; isPro: boolean }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();

  const [rcIsPro, setRcIsPro] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);

  const isPro = Boolean(
    rcIsPro ||
    user?.subscription?.status === 'premium' ||
    user?.subscription?.isPremium,
  );

  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [paywallContext, setPaywallContext] = useState<PaywallContextData | null>(null);
  const [dailyQuota, setDailyQuota] = useState<DailyQuotaData | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);

  // Initialize RevenueCat SDK on mount and sync user identity
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const success = await initializePurchases(user?.id);
      if (!success || !isMounted) return;

      const loadedOfferings = await fetchOfferings();
      if (loadedOfferings && isMounted) {
        setOfferings(loadedOfferings);
        const current = loadedOfferings.current;
        if (current) {
          setMonthlyPackage(current.monthly || null);
          setAnnualPackage(current.annual || null);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync RevenueCat login / logout on auth state changes
  useEffect(() => {
    if (user?.id) {
      identifyUser(user.id).then((info) => {
        if (info) {
          setRcIsPro(hasProEntitlement(info));
        }
      });
    } else if (isGuest) {
      resetPurchasesUser();
      setRcIsPro(false);
    }
  }, [user?.id, isGuest]);

  const openPaywall = useCallback((data?: Partial<PaywallContextData>) => {
    setPaywallContext({
      reason: data?.reason || 'manual',
      resetAt: data?.resetAt || null,
      remainingCount: data?.remainingCount ?? 0,
    });
    setIsPaywallVisible(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsPaywallVisible(false);
    setPaywallContext(null);
  }, []);

  const refreshDailyQuota = useCallback(async () => {
    if (isGuest || !user) {
      setDailyQuota(null);
      return;
    }

    try {
      setIsLoadingQuota(true);
      const res = await apiClient.get<DailyQuotaData>('/playback/daily-quota');
      setDailyQuota(res.data);
    } catch (err) {
      console.warn('[SubscriptionContext] Failed to load daily quota:', err);
    } finally {
      setIsLoadingQuota(false);
    }
  }, [isGuest, user]);

  useEffect(() => {
    refreshDailyQuota();
  }, [refreshDailyQuota]);

  /**
   * Request episode playback access, handling limit and premium errors by triggering Paywall.
   */
  const requestEpisodeAccess = useCallback(
    async (episodeId: string): Promise<AccessResult> => {
      try {
        const res = await apiClient.post<AccessResult>(
          `/playback/episodes/${episodeId}/access`,
        );

        // Update cached quota
        if (res.data && res.data.remainingCount !== undefined) {
          setDailyQuota((prev) =>
            prev
              ? {
                  ...prev,
                  remainingCount: res.data.remainingCount ?? null,
                  usedCount:
                    res.data.dailyLimit !== undefined && res.data.remainingCount !== null
                      ? 3 - (res.data.remainingCount || 0)
                      : prev.usedCount,
                }
              : null,
          );
        }

        return res.data;
      } catch (err: any) {
        const errData = err?.response?.data;
        const errorCode = errData?.errorCode;

        if (errorCode === 'DAILY_LIMIT_EXCEEDED') {
          openPaywall({
            reason: 'daily_limit',
            resetAt: errData.resetAt,
            remainingCount: 0,
          });
          throw new Error('DAILY_LIMIT_EXCEEDED');
        }

        if (errorCode === 'PREMIUM_SUBSCRIPTION_REQUIRED') {
          openPaywall({
            reason: 'premium_episode',
          });
          throw new Error('PREMIUM_SUBSCRIPTION_REQUIRED');
        }

        throw err;
      }
    },
    [openPaywall],
  );

  /**
   * Purchases a subscription plan (annual or monthly) via RevenueCat.
   */
  const purchasePlan = useCallback(
    async (planType: 'annual' | 'monthly'): Promise<{ success: boolean; userCancelled?: boolean }> => {
      const targetPackage = planType === 'annual' ? annualPackage : monthlyPackage;

      if (!targetPackage) {
        // Fallback / Sandbox mode when offerings are not yet published on Google Play
        console.log(`[SubscriptionContext] Modo Simulação/Dev para plano ${planType}`);
        return { success: true };
      }

      try {
        const result = await purchasePackage(targetPackage);
        if (result.userCancelled) {
          return { success: false, userCancelled: true };
        }

        const isNowPro = hasProEntitlement(result.customerInfo);
        setRcIsPro(isNowPro);
        await refreshDailyQuota();
        return { success: isNowPro };
      } catch (err: any) {
        console.warn('[SubscriptionContext] Erro ao assinar:', err);
        throw err;
      }
    },
    [annualPackage, monthlyPackage, refreshDailyQuota],
  );

  /**
   * Restores existing purchases.
   */
  const restoreUserPurchases = useCallback(async (): Promise<{ success: boolean; isPro: boolean }> => {
    try {
      const customerInfo = await restorePurchases();
      const isNowPro = hasProEntitlement(customerInfo);
      setRcIsPro(isNowPro);
      await refreshDailyQuota();
      return { success: true, isPro: isNowPro };
    } catch (err) {
      console.warn('[SubscriptionContext] Erro ao restaurar compras:', err);
      return { success: false, isPro: false };
    }
  }, [refreshDailyQuota]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        isPaywallVisible,
        paywallContext,
        dailyQuota,
        isLoadingQuota,
        offerings,
        monthlyPackage,
        annualPackage,
        openPaywall,
        closePaywall,
        refreshDailyQuota,
        requestEpisodeAccess,
        purchasePlan,
        restoreUserPurchases,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return ctx;
}
