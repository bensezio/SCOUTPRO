import { useAuth } from '@/contexts/auth-context';

export function useUser() {
  const { user, isAuthenticated } = useAuth();

  return {
    user,
    isLoading: false,
    error: null,
    isAuthenticated
  };
}