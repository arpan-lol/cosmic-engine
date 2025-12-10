'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
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

  const processedAttachments = useMemo(() => 
    attachments.filter((att) => att.metadata?.processed),
    [attachments]
  );

  const indexableAttachments = useMemo(() => 
    processedAttachments.filter(
      (att) => !att.bm25indexStatus || att.bm25indexStatus === 'not started'
    ),
    [processedAttachments]
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`session-${sessionId}-selected-files`);
      if (stored) {
        try {
          const storedIds = JSON.parse(stored);
          const indexableIds = indexableAttachments.map(att => att.id);
          const validIds = storedIds.filter((id: string) => indexableIds.includes(id));
          setSelectedIds(validIds);
          if (validIds.length !== storedIds.length) {
            localStorage.setItem(`session-${sessionId}-selected-files`, JSON.stringify(validIds));
          }
        } catch (e) {
          setSelectedIds([]);
        }
      }
    }
  }, [sessionId, indexableAttachments]);

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
          <Badge variant="secondary" className="text-xs">
            BM25 Indexed
          </Badge>
        );
      case 'processing':
      case 'queued':
        return (
          <Badge variant="outline" className="text-xs">
            {status === 'queued' ? 'Queued' : 'Indexing...'}
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="text-xs">
            Failed
          </Badge>
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
            Choose which files to index for hybrid search. Already indexed files are shown but disabled.
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

          {processedAttachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No processed files available.
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-3">
                {processedAttachments.map((attachment) => {
                  const isAlreadyIndexed = attachment.bm25indexStatus === 'completed' || 
                                          attachment.bm25indexStatus === 'processing' || 
                                          attachment.bm25indexStatus === 'queued';
                  const isDisabled = isSubmitting || isAlreadyIndexed;
                  
                  return (
                  <div
                    key={attachment.id}
                    className={`flex items-start space-x-3 p-2 rounded ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'
                    }`}
                    onClick={() => !isDisabled && toggleAttachment(attachment.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(attachment.id)}
                      onCheckedChange={() => toggleAttachment(attachment.id)}
                      disabled={isDisabled}
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
                  );
                })}
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
