'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface AttachmentSelectorProps {
  sessionId: string;
  attachments: Attachment[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  isLoading?: boolean;
  flashTrigger?: number;
}

export default function AttachmentSelector({
  attachments,
  selectedIds,
  onSelectionChange,
  isLoading,
  flashTrigger,
}: AttachmentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (flashTrigger && flashTrigger > 0) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [flashTrigger]);


  const processedAttachments = attachments.filter(
    (att) => {
      return att.metadata?.processed;
    }
  );
  

  const toggleAttachment = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onSelectionChange(processedAttachments.map((att) => att.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isLoading} 
          className={isFlashing ? "animate-pulse border-primary" : ""}
        >
          <FileText className="h-4 w-4 mr-2" />
          Select Files ({selectedIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Select Files for Context</DialogTitle>
          <DialogDescription>
            Choose which files to use for answering your next question
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={processedAttachments.length === 0}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={selectedIds.length === 0}
            >
              Clear All
            </Button>
          </div>

          {processedAttachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No processed documents available
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-3">
                {processedAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-start space-x-3 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => toggleAttachment(attachment.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(attachment.id)}
                      onCheckedChange={() => toggleAttachment(attachment.id)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium leading-none">
                          {attachment.filename}
                        </div>
                        {attachment.bm25indexStatus === 'completed' && (
                          <Badge variant="secondary" className="text-xs">
                            BM25 Indexed
                          </Badge>
                        )}
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

          <div className="flex justify-end pt-4">
            <Button onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
