import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { LoginPage, type LoginFormData, formatAuthError } from '@/features/auth';
import { useAuth, useToast } from '@/shared';

export default function LoginRoute() {
  const router = useRouter();
  const { login, continueAsGuest } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data);
      router.replace('/(app)/books');
    } catch (err: any) {
      const { title, message } = formatAuthError(err);
      toast.error(title, message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToRegister = () => {
    router.push('/(auth)/register');
  };

  const handleContinueAsGuest = async () => {
    await continueAsGuest();
    router.replace('/(app)/books');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/onboarding');
    }
  };

  return (
    <LoginPage
      onLogin={handleLogin}
      onNavigateToRegister={handleNavigateToRegister}
      onContinueAsGuest={handleContinueAsGuest}
      onBack={handleBack}
      isLoading={isLoading}
    />
  );
}
