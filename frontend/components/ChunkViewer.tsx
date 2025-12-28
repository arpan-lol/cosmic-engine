'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Chunk {
  id: string;
  content: string;
  index: number;
}

interface ChunkViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  attachmentId: string;
  filename?: string;
}

async function fetchChunks(sessionId: string, attachmentId: string): Promise<Chunk[]> {
  const response = await api.post(`/chat/sessions/${sessionId}/chunks`, { attachmentId });

  if (!response.ok) {
    throw new Error('Failed to fetch chunks');
  }

  const data = await response.json();
  return data.chunks.map((chunk: any, index: number) => ({
    id: chunk.id || `chunk-${index}`,
    content: chunk.content,
    index: index
  }));
}

export default function ChunkViewer({ open, onOpenChange, sessionId, attachmentId, filename }: ChunkViewerProps) {
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number | null>(null);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedChunkIndex(null);
    }
    onOpenChange(newOpen);
  };

  const { data: chunks, isLoading, error } = useQuery({
    queryKey: ['chunks', sessionId, attachmentId],
    queryFn: () => fetchChunks(sessionId, attachmentId),
    enabled: open,
  });

  const selectedChunk =
    selectedChunkIndex !== null && chunks
      ? chunks[selectedChunkIndex]
      : null;

  const handleNext = () => {
    if (selectedChunkIndex !== null && chunks && selectedChunkIndex < chunks.length - 1) {
      setSelectedChunkIndex(selectedChunkIndex + 1);
    }
  };

  const handlePrev = () => {
    if (selectedChunkIndex !== null && selectedChunkIndex > 0) {
      setSelectedChunkIndex(selectedChunkIndex - 1);
    }
  };

  const handleBack = () => {
    setSelectedChunkIndex(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">
            {selectedChunk 
              ? `Chunk ${selectedChunk.index} of ${(chunks?.length ?? 0) - 1}`
              : `Document Chunks${filename ? ` - ${filename}` : ''}`
            }
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64 text-destructive">
            Failed to load chunks. Please try again.
          </div>
        )}

        {!isLoading && !error && chunks && (
          <>
            {selectedChunk ? (
              <div className="flex flex-col gap-4 flex-1 min-h-0">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={selectedChunkIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={selectedChunkIndex === chunks.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <ScrollArea className="border rounded-md h-[400px]">
                  <div className="p-4">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                      {selectedChunk.content}
                    </pre>
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-2">
                <div className="grid grid-cols-10 gap-1 p-2">
                  {chunks.map((chunk) => (
                    <Button
                      key={chunk.id}
                      variant="outline"
                      className="p-0"
                      onClick={() => setSelectedChunkIndex(chunk.index)}
                    >
                      {chunk.index}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}