'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';

interface Attachment {
  id: string;
  filename: string;
  type: string;
  size: number;
  createdAt: string;
  bm25indexStatus?: string;
  metadata?: {
    processed?: boolean;
    chunkCount?: number;
  };
}

interface BM25FileSelectorProps {
  sessionId: string;
  attachments: Attachment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexingStarted?: () => void;
}

export default function BM25FileSelector({
  sessionId,
  attachments,
  open,
  onOpenChange,
  onIndexingStarted,
}: BM25FileSelectorProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const indexableAttachments = attachments.filter(
    (att) => att.metadata?.processed && (!att.bm25indexStatus || att.bm25indexStatus === 'not started')
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`session-${sessionId}-selected-files`);
      if (stored) {
        try {
          const storedIds = JSON.parse(stored);
          const indexableIds = indexableAttachments.map(att => att.id);
          return storedIds.filter((id: string) => indexableIds.includes(id));
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });

  const toggleAttachment = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedIds(indexableAttachments.map((att) => att.id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one file to index');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post(`/chat/indexbm25/${sessionId}`, {
        attachmentIds: selectedIds,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start BM25 indexing');
      }
      onIndexingStarted?.();
      queryClient.invalidateQueries({ 
        queryKey: ['sessions', sessionId, 'attachments'] 
      });
      setSelectedIds([]);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to start indexing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Indexed
          </span>
        );
      case 'processing':
      case 'queued':
        return (
          <span className="flex items-center gap-1 text-xs text-yellow-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            {status === 'queued' ? 'Queued' : 'Processing'}
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Select Files for BM25 Indexing</DialogTitle>
          <DialogDescription>
            Choose which files to index for hybrid search. Only processed files that haven't been indexed yet are shown.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={indexableAttachments.length === 0 || isSubmitting}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={selectedIds.length === 0 || isSubmitting}
            >
              Clear All
            </Button>
          </div>

          {indexableAttachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No files available for indexing. Files must be processed and not already indexed.
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-3">
                {indexableAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-start space-x-3 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => !isSubmitting && toggleAttachment(attachment.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(attachment.id)}
                      onCheckedChange={() => toggleAttachment(attachment.id)}
                      disabled={isSubmitting}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium leading-none">
                          {attachment.filename}
                        </div>
                        {attachment.bm25indexStatus && getStatusBadge(attachment.bm25indexStatus)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(attachment.size / 1024).toFixed(1)} KB
                        {attachment.metadata?.chunkCount && (
                          <> • {attachment.metadata.chunkCount} chunks</>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedIds.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Indexing'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
