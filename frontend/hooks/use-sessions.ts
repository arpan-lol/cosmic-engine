import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { ChatSession } from '@/lib/types';

export const useSessions = () => {
  return useQuery<ChatSession[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await apiClient.get('/chat/sessions');
      return response.data.sessions;
    },
  });
};

export const useSession = (sessionId: string | null) => {
  return useQuery<ChatSession>({
    queryKey: ['sessions', sessionId],
    queryFn: async () => {
      const response = await apiClient.get(`/chat/sessions/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title?: string) => {
      const response = await apiClient.post('/chat/sessions', { title });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await apiClient.delete(`/chat/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};
