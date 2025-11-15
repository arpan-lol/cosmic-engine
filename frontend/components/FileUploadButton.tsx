'use client';

import { useRef, useState } from 'react';
import { useUploadFile, useAttachmentStatus } from '@/hooks/use-upload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Paperclip, CheckCircle, XCircle, Loader2 } from 'lucide-react';

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
  const uploadFile = useUploadFile();
  const { data: attachmentStatus } = useAttachmentStatus(uploadedAttachmentId);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile.mutateAsync({ file, sessionId });
      setUploadedAttachmentId(result.attachmentId);
      if (onUploadComplete) {
        onUploadComplete(result.attachmentId);
      }
    } catch (error) {
      console.error('Upload failed:', error);
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
        disabled={uploadFile.isPending}
      >
        {uploadFile.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4 mr-2" />
        )}
        Upload File
      </Button>

      {uploadFile.isPending && (
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">Uploading...</div>
              <Progress value={50} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {attachmentStatus && !attachmentStatus.processed && !attachmentStatus.error && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div className="text-sm">
                Processing {attachmentStatus.filename}...
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {attachmentStatus?.processed && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <div className="text-sm">
                {attachmentStatus.filename} processed ({attachmentStatus.chunkCount} chunks)
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {attachmentStatus?.error && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <div className="text-sm">
                Error: {attachmentStatus.error}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
