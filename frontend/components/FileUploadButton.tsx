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
      }
    }
  }, [sessionAttachments, uploadedAttachmentId]);

  // Show toast when processing completes
  useEffect(() => {
    const isCompleted = streamStatus?.status === 'completed' || attachmentStatus?.processed;
    if (isCompleted && !hasShownToast) {
      const filename = attachmentStatus?.filename || 'File';
      const chunkCount = streamStatus?.chunkCount || attachmentStatus?.chunkCount || 0;
      toast.success(`${filename} processed (${chunkCount} chunks)`, {
        duration: 5000,
      });
      setHasShownToast(true);
    }
  }, [streamStatus?.status, attachmentStatus?.processed, hasShownToast, attachmentStatus?.filename, streamStatus?.chunkCount, attachmentStatus?.chunkCount]);

  // Reset toast flag when new upload starts
  useEffect(() => {
    if (isUploading) {
      setHasShownToast(false);
    }
  }, [isUploading]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const result = await uploadFile.mutateAsync({ file, sessionId });
      setUploadedAttachmentId(result.attachmentId);
      if (onUploadComplete) {
        onUploadComplete(result.attachmentId);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
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
        disabled={uploadFile.isPending || isUploading}
      >
        {uploadFile.isPending || isUploading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4 mr-2" />
        )}
        Upload File
      </Button>

      {isUploading && (
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <div className="text-sm font-medium">Uploading...</div>
                </div>
                <div className="text-xs text-muted-foreground">0%</div>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {((isConnected && streamStatus && streamStatus.status === 'processing') || 
        (!isConnected && attachmentStatus && !attachmentStatus.processed && !attachmentStatus.error)) && (
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <div className="text-sm font-medium">
                    {streamStatus?.message || `Processing ${attachmentStatus?.filename || 'file'}...`}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {streamStatus?.progress || 0}%
                </div>
              </div>
              <Progress value={streamStatus?.progress || 0} className="h-2" />
              {streamStatus?.step && (
                <div className="text-xs text-muted-foreground">
                  Step: {streamStatus.step}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(streamStatus?.status === 'error' || attachmentStatus?.error) && (
        <Card>
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
