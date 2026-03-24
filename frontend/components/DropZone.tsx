'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CloudUpload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateConversation } from '@/hooks/use-conversations';
import { usePendingSessionUploads } from '@/contexts/PendingSessionUploadsContext';
import { Button } from '@/components/ui/button';
import { ACCEPTED_FILE_TYPES } from '@/lib/upload';
import { cn } from '@/lib/utils';

export default function DropZone() {
  const router = useRouter();
  const createConversation = useCreateConversation();
  const { setPendingUploads } = usePendingSessionUploads();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);

  const startConversationWithFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) => file.size > 0);

    if (fileArray.length === 0 || createConversation.isPending) {
      return;
    }

    try {
      const result = await createConversation.mutateAsync(undefined);

      if (!result?.sessionId) {
        throw new Error('Session creation failed');
      }

      setPendingUploads(result.sessionId, fileArray);
      router.push(`/dashboard/sessions/${result.sessionId}`);
    } catch (error) {
      console.error('Failed to create conversation from dropped files:', error);
      toast.error('Failed to start a new chat from these files');
    }
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragActive(false);

    if (event.dataTransfer.files.length === 0) {
      return;
    }

    await startConversationWithFiles(event.dataTransfer.files);
  };

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      await startConversationWithFiles(event.target.files);
    }

    event.target.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_FILE_TYPES}
        multiple
        onChange={handleFileInputChange}
      />

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragActive ? 'border-primary bg-muted/60' : 'border-border bg-muted/30'
        )}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background">
            {createConversation.isPending ? (
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            ) : (
              <CloudUpload className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="text-base font-medium">
            Drag &amp; Drop to Upload Files
          </div>
          <div className="text-xs font-medium uppercase text-muted-foreground">
            OR
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              disabled={createConversation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {createConversation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
