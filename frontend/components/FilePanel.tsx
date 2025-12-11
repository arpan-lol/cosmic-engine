'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, X, ArrowLeft, Trash2, ExternalLink } from 'lucide-react';
import { EngineEvent } from '@/lib/types';
import LogsPanel from './LogsPanel';
import ChunkViewer from './ChunkViewer';

const PDFViewer = dynamic(() => import('./PDFViewer'), {
  loading: () => <div>Loading PDF...</div>,
});

interface Attachment {
  id: string;
  filename: string;
  type: string;
  url: string;
  size: number;
  bm25indexStatus?: string;
  metadata?: {
    processed?: boolean;
  };
}

interface FilePanelProps {
  attachments: Attachment[];
  selectedFile?: { filename: string; url: string; targetPage?: number };
  onClose?: () => void;
  onDocumentClick?: (attachment: Attachment) => void;
  onDeleteAttachment?: (attachmentId: string) => void;
  bm25Progress?: Record<string, any>;
  logs?: EngineEvent[];
  sessionId: string;
}

export default function FilePanel({ attachments, selectedFile, onClose, onDocumentClick, onDeleteAttachment, bm25Progress, logs = [], sessionId }: FilePanelProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [chunkViewerOpen, setChunkViewerOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{ id: string; filename: string } | null>(null);


  useEffect(() => {
    if (selectedFile?.targetPage) {
      setCurrentPage(selectedFile.targetPage);
    } else {
      setCurrentPage(1);
    }
  }, [selectedFile?.targetPage, selectedFile?.url]);

  const handleViewChunks = (attachment: Attachment) => {
    setSelectedAttachment({ id: attachment.id, filename: attachment.filename });
    setChunkViewerOpen(true);
  };

  const pdfAttachments = attachments.filter(
    (att) => {
      const isPDF = att.filename.toLowerCase().endsWith('.pdf');
      const isProcessed = att.metadata?.processed;
      return isPDF && isProcessed;
    }
  );
  

  if (!selectedFile && pdfAttachments.length === 0) {
    return (
      <div className="relative h-full">
        <Card className="h-full rounded-none border-0 border-l">
          <CardHeader>
            <CardTitle className="text-lg">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm text-center">No PDF documents available</p>
            </div>
          </CardContent>
        </Card>
        <LogsPanel logs={logs} isDocumentOpen={false} sessionId={sessionId} />
      </div>
    );
  }

  if (!selectedFile) {
    return (
      <div className="relative h-full">
        <Card className="h-full rounded-none border-0 border-l">
          <CardHeader>
            <CardTitle className="text-lg">Documents ({pdfAttachments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {pdfAttachments.map((att) => (
                <Card
                  key={att.id}
                  className="p-3 hover:bg-muted/50 transition-colors mb-2"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onDocumentClick?.(att)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{att.filename}</p>
                        {att.bm25indexStatus === 'completed' && (
                          <Badge variant="secondary" className="text-xs">
                            BM25 Indexed
                          </Badge>
                        )}
                        {(att.bm25indexStatus === 'processing' || att.bm25indexStatus === 'queued') && (
                          <Badge variant="outline" className="text-xs">
                            {bm25Progress?.[att.id]?.message || 'Indexing...'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(att.size / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewChunks(att);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAttachment?.(att.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                  </div>
                </Card>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
        <LogsPanel logs={logs} isDocumentOpen={false} sessionId={sessionId} />
        {selectedAttachment && (
          <ChunkViewer
            open={chunkViewerOpen}
            onOpenChange={setChunkViewerOpen}
            sessionId={sessionId}
            attachmentId={selectedAttachment.id}
            filename={selectedAttachment.filename}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <Card className="h-full flex flex-col overflow-hidden rounded-none border-0 border-l gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{selectedFile.filename}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-3 pt-0 min-h-0">
          <PDFViewer
            fileUrl={selectedFile.url}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
      <LogsPanel logs={logs} isDocumentOpen={true} sessionId={sessionId} />
    </div>
  );
}
