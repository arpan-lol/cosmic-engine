'use client';

import { useRef, useState, useEffect } from 'react';
import { useUploadFile, useAttachmentStatus, useAttachmentStream, useSessionAttachments } from '@/hooks/use-upload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Paperclip, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadButtonProps {
  sessionId: string;
  onUploadComplete?: (attachmentId: string) => void;
}

export default function FileUploadButton({
  sessionId,
  onUploadComplete,
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedAttachmentId, setUploadedAttachmentId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);
  const [wasProcessingOnMount, setWasProcessingOnMount] = useState(false);
  const [isWaitingForProcessing, setIsWaitingForProcessing] = useState(false);
  const [fakeProgress, setFakeProgress] = useState(5);
  const uploadFile = useUploadFile();
  const { data: attachmentStatus } = useAttachmentStatus(uploadedAttachmentId);
  const { streamStatus, isConnected } = useAttachmentStream(uploadedAttachmentId);
  const { data: sessionAttachments } = useSessionAttachments(sessionId);

  // Auto-select the most recent processing attachment on mount
  useEffect(() => {
    if (!uploadedAttachmentId && sessionAttachments?.length) {
      const processingAttachment = sessionAttachments.find(
        (att: any) => !att.processed && !att.error
      );
      if (processingAttachment) {
        setUploadedAttachmentId(processingAttachment.id);
        setWasProcessingOnMount(true);
        setHasShownToast(true);
      }
    }
  }, [sessionAttachments, uploadedAttachmentId]);

  // Show toast when processing completes
  useEffect(() => {
    const isCompleted = streamStatus?.status === 'completed' || attachmentStatus?.processed;
    if (isCompleted && !hasShownToast && !wasProcessingOnMount) {
      const filename = attachmentStatus?.filename || 'File';
      const chunkCount = streamStatus?.chunkCount || attachmentStatus?.chunkCount || 0;
      toast.success(`${filename} processed (${chunkCount} chunks)`, {
        duration: 5000,
      });
      setHasShownToast(true);
    }
  }, [streamStatus?.status, attachmentStatus?.processed, hasShownToast, wasProcessingOnMount, attachmentStatus?.filename, streamStatus?.chunkCount, attachmentStatus?.chunkCount]);

  // Reset toast flag when new upload starts
  useEffect(() => {
    if (isUploading) {
      setHasShownToast(false);
      setWasProcessingOnMount(false);
    }
  }, [isUploading]);

  // Clear waiting state only when processing actually starts (not just connected), completes, or errors
  useEffect(() => {
    if (isWaitingForProcessing && (streamStatus?.status === 'processing' || streamStatus?.status === 'error' || attachmentStatus?.processed || attachmentStatus?.error)) {
      setIsWaitingForProcessing(false);
    }
  }, [isWaitingForProcessing, streamStatus?.status, attachmentStatus?.processed, attachmentStatus?.error]);

  // Simulate slow progress during long preprocessing phase
  useEffect(() => {
    if (!isWaitingForProcessing || streamStatus?.status === 'processing' || streamStatus?.status === 'error' || attachmentStatus?.error) {
      setFakeProgress(5);
      return;
    }

    const interval = setInterval(() => {
      setFakeProgress(prev => {
        if (prev >= 20) return prev;
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isWaitingForProcessing, streamStatus?.status, attachmentStatus?.error]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 50MB limit', {
        description: 'Please upload a smaller file!',
        duration: 6000,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';``
      }
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadFile.mutateAsync({ file, sessionId });
      setUploadedAttachmentId(result.attachmentId);
      setIsUploading(false);
      setIsWaitingForProcessing(true);
      if (onUploadComplete) {
        onUploadComplete(result.attachmentId);
      }
    } catch (error) {
      setIsUploading(false);
      setIsWaitingForProcessing(false);
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      if (errorMessage.includes('413') || errorMessage.includes('size') || errorMessage.includes('limit')) {
        toast.error('File too large', {
          description: 'The file exceeds server upload limits. Please contact support to increase limits or upload a smaller file.',
          duration: 8000,
        });
      } else if (errorMessage.includes('CORS') || errorMessage.includes('fetch')) {
        toast.error('Upload failed', {
          description: 'Network error. Please check your connection and try again.',
          duration: 6000,
        });
      } else {
        toast.error('Upload failed', {
          description: errorMessage,
          duration: 6000,
        });
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const isProcessing = (isConnected && streamStatus && streamStatus.status === 'processing') || 
    (!isConnected && attachmentStatus && !attachmentStatus.processed && !attachmentStatus.error);
  
  const hasError = streamStatus?.status === 'error' || attachmentStatus?.error;
  const showProgressCard = !hasError && (isUploading || isWaitingForProcessing || isProcessing);
  
  const getUnifiedProgress = () => {
    if (isUploading) return 2;
    if (isWaitingForProcessing && streamStatus?.status !== 'processing') return fakeProgress;
    if (streamStatus?.progress !== undefined) {
      return Math.round(5 + (streamStatus.progress * 0.95));
    }
    return 5;
  };
  
  const getStatusMessage = () => {
    if (isUploading) return 'Uploading file...';
    if (isWaitingForProcessing && streamStatus?.status !== 'processing') return 'Preprocessing file...';
    return streamStatus?.message || `Processing ${attachmentStatus?.filename || 'file'}...`;
  };

  return (
    <div className="w-full space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
      />
      <Button
        variant="outline"
        onClick={handleButtonClick}
        disabled={uploadFile.isPending || isUploading || isProcessing}
        className="hover:border-primary"
      >
        {uploadFile.isPending || isUploading || isProcessing ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4 mr-2" />
        )}
        Upload File
      </Button>

      {showProgressCard && (
        <Card className="w-full">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <div className="text-sm font-medium">
                    {getStatusMessage()}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {getUnifiedProgress()}%
                </div>
              </div>
              <Progress value={getUnifiedProgress()} className="h-2" />
              {streamStatus?.step && !isUploading && (
                <div className="text-xs text-muted-foreground">
                  Step: {streamStatus.step}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(streamStatus?.status === 'error' || attachmentStatus?.error) && (
        <Card className="w-full">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <div className="text-sm">
                Processing failed: {streamStatus?.error || attachmentStatus?.error}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
