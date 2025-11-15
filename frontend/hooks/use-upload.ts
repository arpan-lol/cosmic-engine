import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
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

      const response = await apiClient.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
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
      const response = await apiClient.get(
        `/chat/attachments/${attachmentId}/status`
      );
      return response.data;
    },
    enabled: !!attachmentId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && !data.processed && !data.error ? 2000 : false;
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

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
    const token = localStorage.getItem('jwt_token');
    
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

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [attachmentId]);

  return { streamStatus, isConnected };
};

export const useSessionAttachments = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['sessions', sessionId, 'attachments'],
    queryFn: async () => {
      const response = await apiClient.get(`/chat/sessions/${sessionId}/attachments`);
      return response.data.attachments;
    },
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data as any[];
      // Keep refetching if any attachment is still processing
      const hasProcessing = data?.some((att: any) => !att.processed && !att.error);
      return hasProcessing ? 3000 : false;
    },
  });
};
