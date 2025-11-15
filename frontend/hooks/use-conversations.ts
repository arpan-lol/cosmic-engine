import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { Conversation } from '@/lib/types';

export const useConversations = () => {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiClient.get('/chat/sessions');
      return response.data.sessions;
    },
  });
};

export const useConversation = (sessionId: string | null) => {
  return useQuery<Conversation>({
    queryKey: ['conversations', sessionId],
    queryFn: async () => {
      const response = await apiClient.get(`/chat/sessions/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title?: string) => {
      const response = await apiClient.post('/chat/sessions', { title });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await apiClient.delete(`/chat/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
