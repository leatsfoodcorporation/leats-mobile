import { useAuth } from '../context/AuthContext';

/**
 * Hook to check authentication status without redirecting
 * Use this for pages that need to show login prompt instead of redirecting
 * 
 * @returns {Object} - Auth state and user data
 */
export const useAuthCheck = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  return {
    user,
    isAuthenticated,
    isLoading,
  };
};
