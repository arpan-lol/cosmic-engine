'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LLMModel, LLMProvider, ProviderCredential } from '@/lib/types';

async function readError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

export const useLLMModels = () => {
  return useQuery<LLMModel[]>({
    queryKey: ['llm', 'models'],
    queryFn: async () => {
      const response = await api.get('/chat/providers/models');
      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to fetch models'));
      }
      const data = await response.json();
      return data.models;
    },
  });
};

export const useLLMSettings = () => {
  return useQuery<{ selectedModel: string }>({
    queryKey: ['llm', 'settings'],
    queryFn: async () => {
      const response = await api.get('/chat/provider-settings');
      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to fetch model settings'));
      }
      const data = await response.json();
      return data.settings;
    },
  });
};

export const useProviderCredentials = () => {
  return useQuery<ProviderCredential[]>({
    queryKey: ['llm', 'credentials'],
    queryFn: async () => {
      const response = await api.get('/chat/provider-credentials');
      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to fetch API keys'));
      }
      const data = await response.json();
      return data.credentials;
    },
  });
};

export const useUpdateLLMSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (selectedModel: string) => {
      const response = await api.patch('/chat/provider-settings', { selectedModel });
      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to update selected model'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm', 'settings'] });
    },
  });
};

export const useSaveProviderCredential = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      provider: LLMProvider;
      apiKey: string;
      selectedModel?: string;
    }) => {
      const response = await api.post('/chat/provider-credentials', params);
      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to save API key'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm', 'credentials'] });
      queryClient.invalidateQueries({ queryKey: ['llm', 'settings'] });
    },
  });
};

export const useDeleteProviderCredential = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: LLMProvider) => {
      const response = await api.delete(`/chat/provider-credentials/${provider}`);
      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to delete API key'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm', 'credentials'] });
    },
  });
};
