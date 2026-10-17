import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ProfilePage } from '@/features/profile';
import { useAuth } from '@/shared/auth/auth-context';
import { authService, type User } from '@/features/auth';

export default function PerfilRoute() {
  const router = useRouter();
  const { user: authUser, isGuest, logout } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(authUser);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch updated user from backend via Axios on mount if authenticated
  useEffect(() => {
    if (authUser && !isGuest) {
      let isMounted = true;
      setIsLoading(true);
      authService
        .getMe()
        .then((data) => {
          if (isMounted) setProfileUser(data);
        })
        .catch(() => {
          // Fall back to context user if API fails or is offline
          if (isMounted) setProfileUser(authUser);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setProfileUser(null);
    }
  }, [authUser, isGuest]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/onboarding');
  };

  const handleNavigateToLogin = () => {
    router.push('/(auth)/login');
  };

  const handleNavigateToRegister = () => {
    router.push('/(auth)/register');
  };

  return (
    <ProfilePage
      user={profileUser}
      isGuest={isGuest}
      isLoading={isLoading}
      onLogout={handleLogout}
      onNavigateToLogin={handleNavigateToLogin}
      onNavigateToRegister={handleNavigateToRegister}
    />
  );
}
