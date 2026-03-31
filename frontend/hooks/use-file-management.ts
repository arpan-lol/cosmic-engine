import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionAttachments, useDeleteAttachment, useUploadFile, useRetryAttachment } from './use-upload';
import { useSearchOptions } from './use-search-options';
import { useFileViewer } from '@/contexts/FileViewerContext';
import { getAuthToken } from '@/lib/sse-manager';
import { toast } from 'sonner';
import type { TemporaryFile, StreamStatus, Attachment } from '@/lib/types';

interface SelectedFile {
  filename: string;
  url: string;
  targetPage?: number;
  type?: string;
}

interface UseFileManagementOptions {
  sessionId: string;
}

export function useFileManagement({ sessionId }: UseFileManagementOptions) {
  const queryClient = useQueryClient();
  const { setIsFileViewerOpen } = useFileViewer();
  const { options: searchOptions, disableHybridSearch, disableRrfSearch } = useSearchOptions(sessionId);

  const { data: sessionAttachments, isLoading: isLoadingAttachments } = useSessionAttachments(sessionId);
  const deleteAttachmentMutation = useDeleteAttachment();
  const retryAttachmentMutation = useRetryAttachment();
  const uploadFile = useUploadFile();

  const [uploadedAttachments, setUploadedAttachments] = useState<string[]>([]);
  const [temporaryFiles, setTemporaryFiles] = useState<Map<string, TemporaryFile>>(new Map());
  const [fileProcessingProgressByAttachment, setFileProcessingProgressByAttachment] = useState<Record<string, StreamStatus>>({});
  const [bm25Progress, setBm25Progress] = useState<Record<string, StreamStatus>>({});
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`session-${sessionId}-selected-files`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [selectedFile, setSelectedFile] = useState<SelectedFile | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const [flashTrigger, setFlashTrigger] = useState(0);

  const activeStreamsRef = useRef<Set<string>>(new Set());
  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsFileViewerOpen(!!selectedFile);
  }, [selectedFile, setIsFileViewerOpen]);

  const mergedAttachments = useMemo(() => {
    const real = sessionAttachments || [];
    const temp = Array.from(temporaryFiles.values());

    const processedRealIds = new Set(
      real
        .filter((att: Attachment) => att.metadata?.processed === true || !!att.metadata?.error)
        .map((att: Attachment) => att.id)
    );
    const uniqueTemp = temp.filter(t => !processedRealIds.has(t.realId || t.id));

    const tempRealIds = new Set(temp.map(t => t.realId).filter(Boolean));
    const unprocessedReal = real.filter((att: Attachment) => !tempRealIds.has(att.id));

    return [...uniqueTemp, ...unprocessedReal];
  }, [sessionAttachments, temporaryFiles]);

  const fileProcessingProgress = useMemo(() => {
    const progressMap: Record<string, StreamStatus> = { ...fileProcessingProgressByAttachment };

    for (const [id, tempFile] of temporaryFiles.entries()) {
      if (tempFile.processingProgress) {
        progressMap[id] = tempFile.processingProgress;
        if (tempFile.realId) {
          progressMap[tempFile.realId] = tempFile.processingProgress;
        }
      }
    }

    return progressMap;
  }, [fileProcessingProgressByAttachment, temporaryFiles]);

  const disconnectAttachmentStream = useCallback((attachmentId: string) => {
    const eventSource = eventSourcesRef.current.get(attachmentId);
    if (eventSource) {
      eventSource.close();
      eventSourcesRef.current.delete(attachmentId);
    }
    activeStreamsRef.current.delete(attachmentId);
  }, []);

  const connectToAttachmentStream = useCallback(async (attachmentId: string) => {
    if (activeStreamsRef.current.has(attachmentId)) {
      return;
    }

    activeStreamsRef.current.add(attachmentId);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
    const token = await getAuthToken();

    if (!activeStreamsRef.current.has(attachmentId) || eventSourcesRef.current.has(attachmentId)) {
      return;
    }

    const url = new URL(`${API_BASE_URL}/chat/attachments/${attachmentId}/stream`);

    if (token) {
      url.searchParams.set('token', token);
    }

    const eventSource = new EventSource(url.toString(), { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data: StreamStatus = JSON.parse(event.data);

        if (!data.phase || data.phase === 'file-processing') {
          setFileProcessingProgressByAttachment(prev => ({
            ...prev,
            [attachmentId]: data,
          }));

          setTemporaryFiles(prev => {
            let foundKey: string | null = null;
            let foundFile: TemporaryFile | null = null;

            for (const [key, file] of prev.entries()) {
              if (file.realId === attachmentId || file.id === attachmentId) {
                foundKey = key;
                foundFile = file;
                break;
              }
            }

            if (!foundFile || !foundKey) return prev;

            const newMap = new Map(prev);
            newMap.set(foundKey, {
              ...foundFile,
              processingProgress: data,
            });
            return newMap;
          });
        }

        if (data.phase === 'bm25') {
          setBm25Progress(prev => ({
            ...prev,
            [attachmentId]: data,
          }));
        }

        if (data.status === 'completed' || data.status === 'error') {
          if (data.phase === 'bm25') {
            setTimeout(() => {
              setBm25Progress(prev => {
                const next = { ...prev };
                delete next[attachmentId];
                return next;
              });
            }, 3500);
          }

          queryClient.invalidateQueries({
            queryKey: ['sessions', sessionId, 'attachments'],
            refetchType: 'active'
          });

          disconnectAttachmentStream(attachmentId);
        }
      } catch (error) {
        console.error('[AttachmentProgress] Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = () => {
      disconnectAttachmentStream(attachmentId);
    };

    eventSourcesRef.current.set(attachmentId, eventSource);
  }, [disconnectAttachmentStream, queryClient, sessionId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`session-${sessionId}-selected-files`, JSON.stringify(selectedContextIds));
    }
  }, [selectedContextIds, sessionId]);

  useEffect(() => {
    if (sessionAttachments && typeof window !== 'undefined') {
      const validIds = selectedContextIds.filter((id: string) =>
        sessionAttachments.some((att: Attachment) => att.id === id)
      );
      if (validIds.length !== selectedContextIds.length) {
        setSelectedContextIds(validIds);
      }
    }
  }, [sessionAttachments, selectedContextIds]);

  useEffect(() => {
    if (!sessionAttachments || uploadedAttachments.length === 0) return;

    const processedUploads = sessionAttachments
      .filter((att: Attachment) => {
        const isInUploadedList = uploadedAttachments.includes(att.id);
        const isProcessed = att.metadata?.processed === true;
        return isInUploadedList && isProcessed;
      })
      .map((att: Attachment) => att.id);

    if (processedUploads.length > 0) {
      setSelectedContextIds(prev => {
        const newIds = processedUploads.filter((id: string) => !prev.includes(id));
        return newIds.length > 0 ? [...prev, ...newIds] : prev;
      });

      setUploadedAttachments(prev => {
        return prev.filter((id: string) => !processedUploads.includes(id));
      });

      setFlashTrigger(prev => prev + 1);
    }
  }, [sessionAttachments, uploadedAttachments]);

  useEffect(() => {
    if (!sessionAttachments) return;

    setTemporaryFiles(prev => {
      const newMap = new Map(prev);
      let hasChanges = false;

      for (const [tempId, tempFile] of prev.entries()) {
        const realId = tempFile.realId || tempId;
        const existsInDB = sessionAttachments.some((att: Attachment) => att.id === realId);
        const realAtt = sessionAttachments.find((att: Attachment) => att.id === realId);
        const isProcessed = realAtt?.metadata?.processed;
        const hasError = !!realAtt?.metadata?.error;

        if (existsInDB && (isProcessed || hasError)) {
          newMap.delete(tempId);
          hasChanges = true;
        }
      }

      return hasChanges ? newMap : prev;
    });
  }, [sessionAttachments]);

  useEffect(() => {
    const eventSources = eventSourcesRef.current;
    const activeStreams = activeStreamsRef.current;

    return () => {
      eventSources.forEach(eventSource => eventSource.close());
      eventSources.clear();
      activeStreams.clear();
    };
  }, []);

  useEffect(() => {
    const attachmentsNeedingStreams = new Set<string>();

    if (sessionAttachments) {
      for (const attachment of sessionAttachments) {
        const hasFileProcessing = !attachment.metadata?.processed && !attachment.metadata?.error;
        const hasBm25Processing = (attachment as any).bm25indexStatus === 'queued' || (attachment as any).bm25indexStatus === 'processing';

        if (hasFileProcessing || hasBm25Processing) {
          attachmentsNeedingStreams.add(attachment.id);
        }
      }
    }

    for (const tempFile of temporaryFiles.values()) {
      if (tempFile.realId && tempFile.processingProgress?.status !== 'completed' && tempFile.processingProgress?.status !== 'error') {
        attachmentsNeedingStreams.add(tempFile.realId);
      }
    }

    attachmentsNeedingStreams.forEach((attachmentId) => {
      if (!activeStreamsRef.current.has(attachmentId)) {
        connectToAttachmentStream(attachmentId);
      }
    });

    Array.from(activeStreamsRef.current).forEach((attachmentId) => {
      if (!attachmentsNeedingStreams.has(attachmentId)) {
        disconnectAttachmentStream(attachmentId);
      }
    });
  }, [sessionAttachments, temporaryFiles, connectToAttachmentStream, disconnectAttachmentStream]);

  const handleUploadComplete = useCallback((attachmentId: string) => {
    const disabledSearches: string[] = [];

    if (searchOptions.hybridSearch) {
      disableHybridSearch();
      disabledSearches.push('Hybrid');
    }

    if (searchOptions.rrfSearch) {
      disableRrfSearch();
      disabledSearches.push('RRF');
    }

    if (disabledSearches.length > 0) {
      toast.info(`${disabledSearches.join(' & ')} Search disabled`, {
        description: 'New files need BM25 indexing before using advanced search',
        duration: 5000,
      });
    }

    setUploadedAttachments(prev => [...prev, attachmentId]);

    queryClient.invalidateQueries({
      queryKey: ['sessions', sessionId, 'attachments'],
      refetchType: 'active'
    });
  }, [searchOptions, disableHybridSearch, disableRrfSearch, sessionId, queryClient]);

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const maxSize = 50 * 1024 * 1024;

    for (const file of fileArray) {
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds 50MB limit`, {
          description: 'Please upload a smaller file!',
          duration: 6000,
        });
        continue;
      }

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      setTemporaryFiles(prev => new Map(prev).set(tempId, {
        id: tempId,
        filename: file.name,
        type: file.type.includes('pdf') ? 'pdf' : 'document',
        size: file.size,
        isTemporary: true,
        uploadProgress: 0,
        processingProgress: {
          status: 'connected',
          progress: 0,
          message: 'Uploading...',
        },
      }));

      try {
        const result = await uploadFile.mutateAsync({ file, sessionId });

        setTemporaryFiles(prev => {
          const tempFile = prev.get(tempId);
          if (!tempFile) return prev;

          const newMap = new Map(prev);
          newMap.set(tempId, {
            ...tempFile,
            realId: result.attachmentId,
            uploadProgress: 100,
            processingProgress: {
              status: 'connected',
              progress: 0,
              message: 'Connecting...',
            },
          });
          return newMap;
        });

        handleUploadComplete(result.attachmentId);
      } catch (error) {
        setTemporaryFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });

        const errorMessage = error instanceof Error ? error.message : 'Upload failed';

        if (errorMessage.includes('413') || errorMessage.includes('size') || errorMessage.includes('limit')) {
          toast.error(`${file.name} too large`, {
            description: 'The file exceeds server upload limits.',
            duration: 8000,
          });
        } else if (errorMessage.includes('CORS') || errorMessage.includes('fetch')) {
          toast.error(`Upload failed: ${file.name}`, {
            description: 'Network error. Please try again.',
            duration: 6000,
          });
        } else {
          toast.error(`Upload failed: ${file.name}`, {
            description: errorMessage,
            duration: 6000,
          });
        }
      }
    }
  }, [sessionId, uploadFile, handleUploadComplete]);

  const handleCitationClick = useCallback((filename: string, page?: number) => {
    const attachment = sessionAttachments?.find((att: Attachment) => att.filename === filename);
    if (attachment) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
      setSelectedFile({
        filename: attachment.filename,
        url: `${baseUrl}/chat/attachments/${attachment.id}/file`,
        targetPage: page,
        type: attachment.type,
      });
    }
  }, [sessionAttachments]);

  const handleAttachmentClick = useCallback((filename: string) => {
    handleCitationClick(filename);
  }, [handleCitationClick]);

  const handleDocumentClick = useCallback((attachment: { id: string; filename: string; type: string }) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
    setSelectedFile({
      filename: attachment.filename,
      url: `${baseUrl}/chat/attachments/${attachment.id}/file`,
      type: attachment.type,
    });
  }, []);

  const handleRetryAttachment = useCallback(async (attachmentId: string) => {
    try {
      await retryAttachmentMutation.mutateAsync(attachmentId);
      toast.success('Retrying file processing', {
        description: 'The file has been queued for re-processing.',
      });
      queryClient.invalidateQueries({
        queryKey: ['sessions', sessionId, 'attachments'],
        refetchType: 'active'
      });
    } catch (error) {
      toast.error('Failed to retry processing', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [retryAttachmentMutation, sessionId, queryClient]);

  const handleDeleteAttachment = useCallback((attachmentId: string) => {
    setAttachmentToDelete(attachmentId);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteAttachment = useCallback(async () => {
    if (!attachmentToDelete) return;

    try {
      await deleteAttachmentMutation.mutateAsync(attachmentToDelete);

      if (selectedFile) {
        const deletedAttachment = sessionAttachments?.find((att: Attachment) => att.id === attachmentToDelete);
        if (deletedAttachment && selectedFile.url.includes(deletedAttachment.filename)) {
          setSelectedFile(undefined);
        }
      }

      setSelectedContextIds(prev => prev.filter(id => id !== attachmentToDelete));
      setUploadedAttachments(prev => prev.filter(id => id !== attachmentToDelete));

      queryClient.invalidateQueries({ queryKey: ['sessions', sessionId, 'attachments'] });
      toast.success('File deleted successfully');
    } catch {
      toast.error('Failed to delete file. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    }
  }, [attachmentToDelete, deleteAttachmentMutation, selectedFile, sessionAttachments, sessionId, queryClient]);

  const cancelDeleteAttachment = useCallback(() => {
    setDeleteDialogOpen(false);
    setAttachmentToDelete(null);
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const hasProcessingAttachments = sessionAttachments?.some(
    (att: Attachment) => !att.metadata?.processed && !att.metadata?.error
  ) || false;

  const hasBM25Indexing = sessionAttachments?.some(
    (att: Attachment) => (att as any).bm25indexStatus === 'queued' || (att as any).bm25indexStatus === 'processing'
  ) || false;

  return {
    sessionAttachments,
    isLoadingAttachments,
    mergedAttachments,
    selectedContextIds,
    setSelectedContextIds,
    selectedFile,
    setSelectedFile,
    deleteDialogOpen,
    flashTrigger,
    fileInputRef,
    bm25Progress,
    fileProcessingProgress,
    hasProcessingAttachments,
    hasBM25Indexing,
    handleFileUpload,
    handleCitationClick,
    handleAttachmentClick,
    handleDocumentClick,
    handleDeleteAttachment,
    handleRetryAttachment,
    confirmDeleteAttachment,
    cancelDeleteAttachment,
    triggerFileInput,
    clearFileInput,
  };
}
