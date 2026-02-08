import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionAttachments, useDeleteAttachment, useUploadFile, useBM25Progress } from './use-upload';
import { useSearchOptions } from './use-search-options';
import { useFileViewer } from '@/contexts/FileViewerContext';
import { SSEManager, getAuthToken } from '@/lib/sse-manager';
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
  const { options: searchOptions, disableHybridSearch, disableRrfSearch } = useSearchOptions();

  const { data: sessionAttachments, isLoading: isLoadingAttachments } = useSessionAttachments(sessionId);
  const deleteAttachmentMutation = useDeleteAttachment();
  const uploadFile = useUploadFile();
  const bm25Progress = useBM25Progress(sessionId, sessionAttachments);

  const [uploadedAttachments, setUploadedAttachments] = useState<string[]>([]);
  const [temporaryFiles, setTemporaryFiles] = useState<Map<string, TemporaryFile>>(new Map());
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
  const sseManagersRef = useRef<Map<string, SSEManager<StreamStatus>>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsFileViewerOpen(!!selectedFile);
  }, [selectedFile, setIsFileViewerOpen]);

  const mergedAttachments = useMemo(() => {
    const real = sessionAttachments || [];
    const temp = Array.from(temporaryFiles.values());

    const processedRealIds = new Set(
      real
        .filter((att: Attachment) => att.metadata?.processed === true)
        .map((att: Attachment) => att.id)
    );
    const uniqueTemp = temp.filter(t => !processedRealIds.has(t.realId || t.id));

    const tempRealIds = new Set(temp.map(t => t.realId).filter(Boolean));
    const unprocessedReal = real.filter((att: Attachment) => !tempRealIds.has(att.id));

    return [...uniqueTemp, ...unprocessedReal];
  }, [sessionAttachments, temporaryFiles]);

  const fileProcessingProgress = useMemo(() => {
    const progressMap: Record<string, StreamStatus> = {};

    for (const [id, tempFile] of temporaryFiles.entries()) {
      if (tempFile.processingProgress) {
        progressMap[id] = tempFile.processingProgress;
        if (tempFile.realId) {
          progressMap[tempFile.realId] = tempFile.processingProgress;
        }
      }
    }

    return progressMap;
  }, [temporaryFiles]);

  const connectToFileProgressStream = useCallback(async (attachmentId: string, filename: string) => {
    if (activeStreamsRef.current.has(attachmentId)) {
      return;
    }

    activeStreamsRef.current.add(attachmentId);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
    const token = await getAuthToken();

    const sseManager = new SSEManager<StreamStatus>({
      url: `${API_BASE_URL}/chat/attachments/${attachmentId}/stream`,
      token,
      onMessage: (data) => {
        if (!data.phase || data.phase === 'file-processing') {
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

        if (data.status === 'completed' || data.status === 'error') {
          sseManager.disconnect();
          sseManagersRef.current.delete(attachmentId);
          activeStreamsRef.current.delete(attachmentId);
          queryClient.invalidateQueries({
            queryKey: ['sessions', sessionId, 'attachments'],
            refetchType: 'active'
          });
        }
      },
      onError: () => {
        sseManager.disconnect();
        sseManagersRef.current.delete(attachmentId);
        activeStreamsRef.current.delete(attachmentId);
      },
    });

    sseManagersRef.current.set(attachmentId, sseManager);
    sseManager.connect();
  }, [sessionId, queryClient]);

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
        const isProcessed = sessionAttachments.find((att: Attachment) => att.id === realId)?.metadata?.processed;

        if (existsInDB && isProcessed) {
          newMap.delete(tempId);
          hasChanges = true;
        }
      }

      return hasChanges ? newMap : prev;
    });
  }, [sessionAttachments]);

  useEffect(() => {
    return () => {
      sseManagersRef.current.forEach(manager => manager.disconnect());
      sseManagersRef.current.clear();
      activeStreamsRef.current.clear();
    };
  }, []);

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

        setTimeout(() => {
          connectToFileProgressStream(result.attachmentId, file.name);
        }, 100);

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
  }, [sessionId, uploadFile, connectToFileProgressStream, handleUploadComplete]);

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
    } catch (error) {
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
    confirmDeleteAttachment,
    cancelDeleteAttachment,
    triggerFileInput,
    clearFileInput,
  };
}
