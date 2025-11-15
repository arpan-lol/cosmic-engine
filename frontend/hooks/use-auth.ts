import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { User } from '@/lib/types';

export const useAuth = () => {
  return useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      localStorage.removeItem('jwt_token');
      if (typeof document !== 'undefined') {
        document.cookie = 'jwt_token=; Max-Age=0; path=/';
      }
      queryClient.clear();
      window.location.href = '/auth/login';
    },
  });
};

export const useGoogleAuth = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
  
  const initiateGoogleAuth = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return { initiateGoogleAuth };
};
