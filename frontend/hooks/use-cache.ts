import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CacheEntry {
  id: string;
  cacheKey: string;
  sessionId: string;
  sessionTitle: string | null;
  query: string;
  attachmentNames: string[];
  options: Record<string, any>;
  createdAt: string;
  lastSeenAt: string;
}

export const useCache = () => {
  return useQuery<CacheEntry[]>({
    queryKey: ['cache'],
    queryFn: async () => {
      const response = await api.get('/chat/cache');
      const data = await response.json();
      return data.cache;
    },
  });
};