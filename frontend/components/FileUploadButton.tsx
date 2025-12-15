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

interface UploadingFile {
  id: string;
  filename: string;
  isUploading: boolean;
  isWaitingForProcessing: boolean;
  fakeProgress: number;
  hasShownToast: boolean;
}

export default function FileUploadButton({
  sessionId,
  onUploadComplete,
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
  const uploadFile = useUploadFile();
  const { data: sessionAttachments } = useSessionAttachments(sessionId);

  // Auto-detect processing attachments on mount
  useEffect(() => {
    if (sessionAttachments?.length) {
      const processingAttachments = sessionAttachments.filter(
        (att: any) => !att.metadata?.processed && !att.metadata?.error
      );
      
      processingAttachments.forEach((att: any) => {
        if (!uploadingFiles.has(att.id)) {
          setUploadingFiles(prev => new Map(prev).set(att.id, {
            id: att.id,
            filename: att.filename,
            isUploading: false,
            isWaitingForProcessing: true,
            fakeProgress: 5,
            hasShownToast: true,
          }));
        }
      });
    }
  }, [sessionAttachments]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxSize = 50 * 1024 * 1024;
    
    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds 50MB limit`, {
          description: 'Please upload a smaller file!',
          duration: 6000,
        });
        continue;
      }

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      
      setUploadingFiles(prev => new Map(prev).set(tempId, {
        id: tempId,
        filename: file.name,
        isUploading: true,
        isWaitingForProcessing: false,
        fakeProgress: 5,
        hasShownToast: false,
      }));

      try {
        const result = await uploadFile.mutateAsync({ file, sessionId });
        
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          newMap.set(result.attachmentId, {
            id: result.attachmentId,
            filename: file.name,
            isUploading: false,
            isWaitingForProcessing: true,
            fakeProgress: 5,
            hasShownToast: false,
          });
          return newMap;
        });

        if (onUploadComplete) {
          onUploadComplete(result.attachmentId);
        }
      } catch (error) {
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });

        console.error('Upload failed:', error);
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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const hasAnyUploading = Array.from(uploadingFiles.values()).some(f => f.isUploading);
  const hasAnyProcessing = Array.from(uploadingFiles.values()).some(f => f.isWaitingForProcessing);

  return (
    <div className="w-full space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        multiple
      />
      <Button
        id="file-upload-button"
        variant="outline"
        onClick={handleButtonClick}
        disabled={uploadFile.isPending || hasAnyUploading || hasAnyProcessing}
        className="hover:border-primary"
      >
        {uploadFile.isPending || hasAnyUploading || hasAnyProcessing ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4 mr-2" />
        )}
        Upload File
      </Button>

      {Array.from(uploadingFiles.entries()).map(([id, fileInfo]) => (
        <FileProgressCard 
          key={id}
          attachmentId={id}
          fileInfo={fileInfo}
          onComplete={(attachmentId) => {
            setUploadingFiles(prev => {
              const newMap = new Map(prev);
              newMap.delete(attachmentId);
              return newMap;
            });
          }}
          onError={(attachmentId) => {
            setUploadingFiles(prev => {
              const newMap = new Map(prev);
              newMap.delete(attachmentId);
              return newMap;
            });
          }}
        />
      ))}
    </div>
  );
}

interface FileProgressCardProps {
  attachmentId: string;
  fileInfo: UploadingFile;
  onComplete: (attachmentId: string) => void;
  onError: (attachmentId: string) => void;
}

function FileProgressCard({ attachmentId, fileInfo, onComplete, onError }: FileProgressCardProps) {
  const [fakeProgress, setFakeProgress] = useState(fileInfo.fakeProgress);
  const [hasShownToast, setHasShownToast] = useState(fileInfo.hasShownToast);
  const { data: attachmentStatus } = useAttachmentStatus(attachmentId.startsWith('temp-') ? null : attachmentId);
  const { streamStatus } = useAttachmentStream(attachmentId.startsWith('temp-') ? null : attachmentId);

  // Simulate slow progress during preprocessing
  useEffect(() => {
    if (!fileInfo.isWaitingForProcessing || streamStatus?.status === 'processing' || streamStatus?.status === 'error' || attachmentStatus?.error) {
      return;
    }

    const interval = setInterval(() => {
      setFakeProgress(prev => {
        if (prev >= 20) return prev;
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [fileInfo.isWaitingForProcessing, streamStatus?.status, attachmentStatus?.error]);

  // Show toast when processing completes
  useEffect(() => {
    const isCompleted = streamStatus?.status === 'completed' || attachmentStatus?.processed;
    if (isCompleted && !hasShownToast) {
      const filename = attachmentStatus?.filename || fileInfo.filename;
      const chunkCount = streamStatus?.chunkCount || attachmentStatus?.chunkCount || 0;
      toast.success(`${filename} processed (${chunkCount} chunks)`, {
        duration: 5000,
      });
      setHasShownToast(true);
      setTimeout(() => onComplete(attachmentId), 2000);
    }
  }, [streamStatus?.status, attachmentStatus?.processed, hasShownToast, attachmentStatus?.filename, streamStatus?.chunkCount, attachmentStatus?.chunkCount, fileInfo.filename, attachmentId, onComplete]);

  // Handle errors
  useEffect(() => {
    const hasError = streamStatus?.status === 'error' || attachmentStatus?.error;
    if (hasError) {
      setTimeout(() => onError(attachmentId), 3000);
    }
  }, [streamStatus?.status, attachmentStatus?.error, attachmentId, onError]);

  const isProcessing = streamStatus?.status === 'processing' || 
    (!attachmentStatus?.processed && !attachmentStatus?.error && fileInfo.isWaitingForProcessing);
  
  const hasError = streamStatus?.status === 'error' || attachmentStatus?.error;
  const showProgressCard = !hasError && (fileInfo.isUploading || fileInfo.isWaitingForProcessing || isProcessing);
  
  const getUnifiedProgress = () => {
    if (fileInfo.isUploading) return 2;
    if (streamStatus?.status === 'completed') return 100;
    if (fileInfo.isWaitingForProcessing && streamStatus?.status !== 'processing') return fakeProgress;
    if (streamStatus?.progress !== undefined) {
      return Math.round(5 + (streamStatus.progress * 0.95));
    }
    return 5;
  };
  
  const getStatusMessage = () => {
    if (fileInfo.isUploading) return `Uploading ${fileInfo.filename}...`;
    if (fileInfo.isWaitingForProcessing && streamStatus?.status !== 'processing') return `Preprocessing ${fileInfo.filename}...`;
    return streamStatus?.message || `Processing ${fileInfo.filename}...`;
  };

  if (!showProgressCard && !hasError) return null;

  return (
    <>
      {showProgressCard && (
        <Card className="w-full">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  <div className="text-sm font-medium truncate">
                    {getStatusMessage()}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">
                  {getUnifiedProgress()}%
                </div>
              </div>
              <Progress value={getUnifiedProgress()} className="h-2" />
              {streamStatus?.step && !fileInfo.isUploading && (
                <div className="text-xs text-muted-foreground">
                  Step: {streamStatus.step}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {hasError && (
        <Card className="w-full">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <div className="text-sm truncate">
                {fileInfo.filename}: {streamStatus?.error || attachmentStatus?.error}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
