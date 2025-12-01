import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AttachmentStatus } from '@/lib/types';

interface StreamStatus {
  status: 'processing' | 'completed' | 'error';
  step?: string;
  message?: string;
  progress?: number;
  chunkCount?: number;
  embeddingCount?: number;
  error?: string;
}

export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      sessionId,
    }: {
      file: File;
      sessionId: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      const response = await api.request('/chat/upload', {
        method: 'POST',
        body: formData,
        headers: {},
      });

      if (response.status === 413) {
        throw new Error('File size exceeds the maximum limit. Please check your server configuration for upload limits.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['conversations', variables.sessionId],
      });
    },
  });
};

export const useAttachmentStatus = (attachmentId: string | null) => {
  return useQuery<AttachmentStatus>({
    queryKey: ['attachments', attachmentId, 'status'],
    queryFn: async () => {
      const response = await api.get(
        `/chat/attachments/${attachmentId}/status`
      );
      return await response.json();
    },
    enabled: !!attachmentId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && !data.processed && !data.error ? 500 : false;
    },
  });
};

export const useAttachmentStream = (attachmentId: string | null) => {
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!attachmentId) {
      setStreamStatus(null);
      setIsConnected(false);
      return;
    }

    const connectToStream = async () => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
      
      let token: string | null = null;
      try {
        const tokenResponse = await fetch('/api/auth/token');
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          token = tokenData.token;
        }
      } catch (error) {
        console.error('[SSE] Failed to get token:', error);
      }
      
      console.log('[SSE] Connecting to stream for attachment:', attachmentId);
      console.log('[SSE] Token available:', !!token);
      
      const url = new URL(`${API_BASE_URL}/chat/attachments/${attachmentId}/stream`);
      if (token) {
        url.searchParams.set('token', token);
      }
      
      console.log('[SSE] URL:', url.toString());
      
      const eventSource = new EventSource(url.toString(), { withCredentials: true });

      setIsConnected(true);

      eventSource.onmessage = (event) => {
        try {
          const data: StreamStatus = JSON.parse(event.data);
          setStreamStatus(data);

          if (data.status === 'completed' || data.status === 'error') {
            eventSource.close();
            setIsConnected(false);
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        setIsConnected(false);
      };

      return eventSource;
    };

    let eventSourcePromise = connectToStream();

    return () => {
      eventSourcePromise.then((eventSource) => {
        if (eventSource) {
          eventSource.close();
        }
      });
      setIsConnected(false);
    };
  }, [attachmentId]);

  return { streamStatus, isConnected };
};

export const useSessionAttachments = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['sessions', sessionId, 'attachments'],
    queryFn: async () => {
      const response = await api.get(`/chat/sessions/${sessionId}/attachments`);
      const data = await response.json();
      return data.attachments;
    },
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data as any[];
      const hasProcessing = data?.some((att: any) => 
        !att.metadata?.processed && !att.metadata?.error
      );
      return hasProcessing ? 2000 : false;
    },
    staleTime: 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await api.delete(`/chat/attachments/${attachmentId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(errorData.error || `Delete failed with status ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: (_, attachmentId) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
