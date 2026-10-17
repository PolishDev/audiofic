import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingPage } from '@/features/auth';
import { useAuth } from '@/shared/auth/auth-context';

export default function OnboardingRoute() {
  const router = useRouter();
  const { continueAsGuest } = useAuth();

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const handleRegister = () => {
    router.push('/(auth)/register');
  };

  const handleContinueAsGuest = async () => {
    await continueAsGuest();
    router.replace('/(app)/books');
  };

  return (
    <OnboardingPage
      onLogin={handleLogin}
      onRegister={handleRegister}
      onContinueAsGuest={handleContinueAsGuest}
    />
  );
}
