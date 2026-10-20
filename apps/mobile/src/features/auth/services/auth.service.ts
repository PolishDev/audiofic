import { apiClient } from '../../../shared/api/axios-client';
import { authClient } from '../../../shared/lib/auth-client';
import type { LoginFormData, RegisterFormData, User } from '../types';

export const authService = {
  /**
   * Log in via Better Auth / Axios
   */
  async login(data: LoginFormData) {
    const res = await authClient.signIn.email({
      email: data.email.trim(),
      password: data.password,
    });

    if (res.error) {
      throw new Error(res.error.message || 'Credenciais inválidas');
    }

    return res.data;
  },

  /**
   * Sign up via Better Auth / Axios
   */
  async register(data: RegisterFormData) {
    const res = await authClient.signUp.email({
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
    });

    if (res.error) {
      throw new Error(res.error.message || 'Falha ao criar conta');
    }

    return res.data;
  },

  /**
   * Sign out
   */
  async logout() {
    await authClient.signOut();
  },

  /**
   * Fetch current authenticated user profile using Axios
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  /**
   * Delete user account and cascade delete all associated data from server.
   * Required by Apple App Store & Google Play guidelines.
   */
  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>('/users/me');
    try {
      await authClient.signOut();
    } catch {
      // Ignore if session already destroyed
    }
    return response.data;
  },
};
