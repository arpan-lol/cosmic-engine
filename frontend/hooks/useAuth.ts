'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export interface User {
  userId: string;
  email: string;
  name: string;
  picture: string;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/auth/me');

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
        if (response.status === 401) {
          router.push('/auth/login');
        }
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');

      await fetch('/api/auth/token', {
        method: 'DELETE',
      });

      setUser(null);
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  }, [router]);

  const refetch = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    logout,
    refetch,
  };
}
