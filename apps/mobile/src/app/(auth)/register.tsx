import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { RegisterPage, type RegisterFormData, formatAuthError } from '@/features/auth';
import { useAuth, useToast } from '@/shared';

export default function RegisterRoute() {
  const router = useRouter();
  const { register, continueAsGuest } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await register(data);
      router.replace('/(app)/books');
    } catch (err: any) {
      const { title, message } = formatAuthError(err);
      toast.error(title, message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToLogin = () => {
    router.push('/(auth)/login');
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
    <RegisterPage
      onRegister={handleRegister}
      onNavigateToLogin={handleNavigateToLogin}
      onContinueAsGuest={handleContinueAsGuest}
      onBack={handleBack}
      isLoading={isLoading}
    />
  );
}
