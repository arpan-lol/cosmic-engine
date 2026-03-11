import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AttachmentStatus } from '@/lib/types';

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
      const hasBM25Indexing = data?.some((att: any) => 
        att.bm25indexStatus === 'queued' || att.bm25indexStatus === 'processing'
      );
      return (hasProcessing || hasBM25Indexing) ? 5000 : false;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
