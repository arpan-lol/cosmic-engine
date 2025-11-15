import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Conversation } from '@/lib/types';

export const useConversations = () => {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get('/chat/sessions');
      const data = await response.json();
      return data.sessions;
    },
  });
};

export const useConversation = (sessionId: string | null) => {
  return useQuery<Conversation>({
    queryKey: ['conversations', sessionId],
    queryFn: async () => {
      const response = await api.get(`/chat/sessions/${sessionId}`);
      return await response.json();
    },
    enabled: !!sessionId,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title?: string) => {
      const response = await api.post('/chat/sessions', { title });
      return await response.json();
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
      await api.delete(`/chat/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
