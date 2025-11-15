import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SearchResponse } from '@/lib/types';

export const useSemanticSearch = (
  sessionId: string | null,
  query: string | null,
  topK: number = 10
) => {
  return useQuery<SearchResponse>({
    queryKey: ['search', sessionId, query, topK],
    queryFn: async () => {
      const response = await api.post(`/chat/sessions/${sessionId}/search`, {
        query,
        topK,
      });
      return await response.json();
    },
    enabled: !!sessionId && !!query,
  });
};
