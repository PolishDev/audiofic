import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PurchasesPackage,
  CustomerInfo,
  PurchasesOfferings,
} from 'react-native-purchases';

// RevenueCat Public API Keys
// Set in .env as EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY
const REVENUECAT_GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || '';

// The entitlement identifier defined in RevenueCat dashboard
export const ENTITLEMENT_ID = 'pro_access';

let isConfigured = false;

/**
 * Initializes RevenueCat SDK with the appropriate platform API key and app user ID.
 */
export async function initializePurchases(appUserId?: string | null): Promise<boolean> {
  if (isConfigured) {
    if (appUserId) {
      await identifyUser(appUserId);
    }
    return true;
  }

  const apiKey = Platform.select({
    android: REVENUECAT_GOOGLE_API_KEY,
    default: REVENUECAT_GOOGLE_API_KEY,
  });

  if (!apiKey || apiKey.startsWith('goog_your_')) {
    console.warn(
      '[RevenueCat] EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY não configurada. Operando em modo de teste local.',
    );
    return false;
  }

  try {
    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({
      apiKey,
      appUserID: appUserId || undefined,
    });

    isConfigured = true;
    console.log('[RevenueCat] Inicializado com sucesso para:', appUserId || 'visitante');
    return true;
  } catch (err) {
    console.warn('[RevenueCat] Falha ao configurar SDK:', err);
    return false;
  }
}

/**
 * Identifies the authenticated user in RevenueCat.
 */
export async function identifyUser(userId: string): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    return customerInfo;
  } catch (err) {
    console.warn('[RevenueCat] Erro ao sincronizar login do usuário:', err);
    return null;
  }
}

/**
 * Resets user identity when logging out.
 */
export async function resetPurchasesUser(): Promise<void> {
  if (!isConfigured) return;
  try {
    await Purchases.logOut();
  } catch (err) {
    console.warn('[RevenueCat] Erro ao deslogar do RevenueCat:', err);
  }
}

/**
 * Checks if a CustomerInfo has the active PRO entitlement.
 */
export function hasProEntitlement(customerInfo?: CustomerInfo | null): boolean {
  if (!customerInfo) return false;
  return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
}

/**
 * Fetches available offerings and subscription packages from RevenueCat.
 */
export async function fetchOfferings(): Promise<PurchasesOfferings | null> {
  if (!isConfigured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (err) {
    console.warn('[RevenueCat] Erro ao buscar ofertas:', err);
    return null;
  }
}

/**
 * Purchases a selected subscription package through the native store.
 */
export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<{ customerInfo: CustomerInfo; userCancelled: boolean }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { customerInfo, userCancelled: false };
  } catch (err: any) {
    if (err?.userCancelled) {
      return { customerInfo: null as any, userCancelled: true };
    }
    throw err;
  }
}

/**
 * Restores previous purchases made by the user in the app store.
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}
