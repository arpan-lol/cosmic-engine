import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
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

      const response = await apiClient.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sessions', variables.sessionId],
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
