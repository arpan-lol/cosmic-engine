import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

export const useAuth = () => {
  return useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const data = await response.json();
      return data.user;
    },
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: async () => {
      await fetch('/api/auth/token', { method: 'DELETE' });
      queryClient.clear();
      window.location.href = '/auth/login';
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Still clear local state
      queryClient.clear();
      window.location.href = '/auth/login';
    },
  });
};

export const useGoogleAuth = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
  console.log('[frontend/useGoogleAuth] API_BASE_URL:', API_BASE_URL);
  
  const initiateGoogleAuth = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return { initiateGoogleAuth };
};
