import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { authClient } from '../lib/auth-client';
import { authService } from '../../features/auth/services/auth.service';
import type { LoginFormData, RegisterFormData, User } from '../../features/auth/types';

const GUEST_STORAGE_KEY = 'audiofic_guest_mode';
const SESSION_TOKEN_KEY = 'audiofic_session_token';

interface AuthContextType {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    try {
      const sessionPromise = authClient.getSession();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Tempo esgotado ao verificar sessão')),
          8000,
        ),
      );

      const response = (await Promise.race([
        sessionPromise,
        timeoutPromise,
      ])) as any;

      if (response?.data?.user) {
        setUser(response.data.user as User);
        setSession(response.data.session);
        setIsGuest(false);
        await SecureStore.setItemAsync(GUEST_STORAGE_KEY, 'false');

        // Extract and cache raw session token if present
        if (response.data.session?.token) {
          await SecureStore.setItemAsync(
            SESSION_TOKEN_KEY,
            response.data.session.token,
          ).catch(() => {});
        }
      } else {
        setUser(null);
        setSession(null);
        const guestPref = await SecureStore.getItemAsync(GUEST_STORAGE_KEY);
        setIsGuest(guestPref === 'true');
      }
    } catch (err: any) {
      console.warn(
        '[AuthContext] Verificação de sessão falhou ou expirou:',
        err?.message || err,
      );
      const guestPref = await SecureStore.getItemAsync(GUEST_STORAGE_KEY);
      if (guestPref === 'true') {
        setUser(null);
        setSession(null);
        setIsGuest(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const continueAsGuest = async () => {
    setUser(null);
    setSession(null);
    setIsGuest(true);
    await SecureStore.setItemAsync(GUEST_STORAGE_KEY, 'true');
  };

  const login = async (data: LoginFormData) => {
    setIsLoading(true);
    console.log('[AuthContext] Tentando login:', data.email);
    try {
      const authPromise = authClient.signIn.email({
        email: data.email.trim(),
        password: data.password,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Tempo esgotado ao conectar ao servidor. Verifique a conexão com o backend.',
              ),
            ),
          12000,
        ),
      );

      const res = await Promise.race([authPromise, timeoutPromise]);

      if (res.error) {
        throw new Error(res.error.message || 'Falha ao autenticar');
      }

      setIsGuest(false);
      await SecureStore.setItemAsync(GUEST_STORAGE_KEY, 'false');
      await refreshSession();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterFormData) => {
    setIsLoading(true);
    console.log('[AuthContext] Tentando cadastro:', data.email);
    try {
      const authPromise = authClient.signUp.email({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Tempo esgotado ao conectar ao servidor. Verifique a conexão com o backend.',
              ),
            ),
          12000,
        ),
      );

      const res = await Promise.race([authPromise, timeoutPromise]);

      if (res.error) {
        throw new Error(res.error.message || 'Falha ao cadastrar');
      }

      setIsGuest(false);
      await SecureStore.setItemAsync(GUEST_STORAGE_KEY, 'false');
      await refreshSession();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY).catch(() => {});
      await SecureStore.deleteItemAsync('shortstory_session_token').catch(() => {});
      setUser(null);
      setSession(null);
      setIsGuest(true);
      await SecureStore.setItemAsync(GUEST_STORAGE_KEY, 'true');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    try {
      await authService.deleteAccount();
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY).catch(() => {});
      await SecureStore.deleteItemAsync('shortstory_session_token').catch(() => {});
      setUser(null);
      setSession(null);
      setIsGuest(true);
      await SecureStore.setItemAsync(GUEST_STORAGE_KEY, 'true');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isGuest,
        isLoading,
        login,
        register,
        logout,
        deleteAccount,
        continueAsGuest,
        refreshSession,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
