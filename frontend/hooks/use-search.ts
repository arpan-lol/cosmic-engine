import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { SearchResponse } from '@/lib/types';

export const useSemanticSearch = (
  sessionId: string | null,
  query: string | null,
  topK: number = 10
) => {
  return useQuery<SearchResponse>({
    queryKey: ['search', sessionId, query, topK],
    queryFn: async () => {
      const response = await apiClient.post(`/chat/sessions/${sessionId}/search`, {
        query,
        topK,
      });
      return response.data;
    },
    enabled: !!sessionId && !!query,
  });
};
