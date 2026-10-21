import axios, { type InternalAxiosRequestConfig } from 'axios';
import { safeStorage as SecureStore } from '../lib/safe-storage';
import { API_BASE_URL, authClient } from '../lib/auth-client';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Extracts and formats valid authentication headers (Cookie & Authorization Bearer)
 * compatible with Better Auth on backend.
 */
async function getAuthHeaders(): Promise<{ cookie?: string; authorization?: string }> {
  let cookieHeader = '';
  let token = '';

  // 1. Try native getCookie from better-auth expo client plugin
  try {
    if (typeof (authClient as any).getCookie === 'function') {
      const cookie = await (authClient as any).getCookie();
      if (cookie && typeof cookie === 'string' && cookie.includes('=')) {
        cookieHeader = cookie;
      }
    }
  } catch (err) {
    // Silently proceed to fallback
  }

  // 2. Fallback / supplementary check: Inspect 'audiofic_cookie' / 'shortstory_cookie'
  try {
    const rawCookie =
      (await SecureStore.getItemAsync('audiofic_cookie')) ||
      (await SecureStore.getItemAsync('shortstory_cookie'));
    if (rawCookie) {
      const parsed = JSON.parse(rawCookie);

      // If getCookie didn't produce the cookie header, build it from the JSON
      if (!cookieHeader && typeof parsed === 'object') {
        const parts: string[] = [];
        for (const [key, val] of Object.entries(parsed)) {
          const v = (val as any)?.value ?? val;
          const expires = (val as any)?.expires;
          if (v && (!expires || new Date(expires) > new Date())) {
            parts.push(`${key}=${v}`);
          }
        }
        if (parts.length > 0) {
          cookieHeader = parts.join('; ');
        }
      }

      // Extract raw session token for Bearer Authorization header
      const sessionEntry =
        parsed['better-auth.session_token'] ||
        parsed['__Secure-better-auth.session_token'];
      const rawVal = sessionEntry?.value ?? sessionEntry;
      if (typeof rawVal === 'string') {
        token = rawVal.split('.')[0];
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  // 3. Fallback for token: check 'audiofic_session_data' / 'shortstory_session_data'
  if (!token) {
    try {
      const rawSessionData =
        (await SecureStore.getItemAsync('audiofic_session_data')) ||
        (await SecureStore.getItemAsync('shortstory_session_data'));
      if (rawSessionData) {
        const sessionObj = JSON.parse(rawSessionData);
        if (sessionObj?.session?.token) {
          token = sessionObj.session.token;
        }
      }
    } catch {
      // Ignore
    }
  }

  // 4. Fallback for token: check 'audiofic_session_token' / 'shortstory_session_token'
  if (!token) {
    try {
      const storedToken =
        (await SecureStore.getItemAsync('audiofic_session_token')) ||
        (await SecureStore.getItemAsync('shortstory_session_token'));
      if (storedToken) {
        token = storedToken;
      }
    } catch {
      // Ignore
    }
  }

  // Cache token if we extracted one
  if (token) {
    SecureStore.setItemAsync('audiofic_session_token', token).catch(() => {});
  }

  return {
    cookie: cookieHeader || undefined,
    authorization: token ? `Bearer ${token}` : undefined,
  };
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const { cookie, authorization } = await getAuthHeaders();

      if (cookie && !config.headers.cookie) {
        config.headers.cookie = cookie;
      }

      if (authorization && !config.headers.Authorization) {
        config.headers.Authorization = authorization;
      }
    } catch (err) {
      console.warn('[ApiClient] Falha ao anexar credenciais na requisição:', err);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        `[ApiClient] 401 Unauthorized para ${error.config?.url}. Sessão pode estar expirada.`,
      );
    }

    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    return Promise.reject(error);
  },
);
