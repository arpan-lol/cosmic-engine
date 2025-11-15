import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

export const useAuth = () => {
  return useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      const data = await response.json();
      return data.user;
    },
    retry: false,
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
  });
};

export const useGoogleAuth = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
  
  const initiateGoogleAuth = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return { initiateGoogleAuth };
};
