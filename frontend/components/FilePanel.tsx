'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, X, ArrowLeft, Trash2, ExternalLink, FileImage, FileSpreadsheet, File } from 'lucide-react';
import { EngineEvent, StreamStatus } from '@/lib/types';
import LogsPanel from './LogsPanel';
import ChunkViewer from './ChunkViewer';
import { Progress } from '@/components/ui/progress';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ImperativePanelHandle } from 'react-resizable-panels';

const FileViewer = dynamic(() => import('./FileViewer'), {
  loading: () => <div>Loading file...</div>,
});

interface Attachment {
  id: string;
  filename: string;
  type: string;
  url?: string;
  size: number;
  bm25indexStatus?: string;
  isTemporary?: boolean;
  mimeType?: string;
  metadata?: {
    processed?: boolean;
  };
}

interface FilePanelProps {
  attachments: Attachment[];
  selectedFile?: { filename: string; url: string; targetPage?: number; type?: string };
  onClose?: () => void;
  onDocumentClick?: (attachment: Attachment) => void;
  onDeleteAttachment?: (attachmentId: string) => void;
  bm25Progress?: Record<string, StreamStatus>;
  fileProcessingProgress?: Record<string, StreamStatus>;
  logs?: EngineEvent[];
  sessionId: string;
}

export default function FilePanel({ attachments, selectedFile, onClose, onDocumentClick, onDeleteAttachment, bm25Progress, fileProcessingProgress, logs = [], sessionId }: FilePanelProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [chunkViewerOpen, setChunkViewerOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{ id: string; filename: string } | null>(null);
  const logsPanelRef = useRef<ImperativePanelHandle>(null);
  const isDocumentOpen = !!selectedFile;


  useEffect(() => {
    if (selectedFile?.url) {
      if (selectedFile.targetPage) {
        setCurrentPage(selectedFile.targetPage);
      } else {
        setCurrentPage(1);
      }
    }
  }, [selectedFile?.url, selectedFile?.targetPage]);

  const handleViewChunks = (attachment: Attachment) => {
    setSelectedAttachment({ id: attachment.id, filename: attachment.filename });
    setChunkViewerOpen(true);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage className="h-4 w-4 text-green-500" />;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    if (ext === 'pdf') return <FileText className="h-4 w-4 text-red-500" />;
    if (['doc', 'docx'].includes(ext)) return <FileText className="h-4 w-4 text-blue-500" />;
    if (['ppt', 'pptx'].includes(ext)) return <FileText className="h-4 w-4 text-red-600" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const viewableAttachments = attachments.filter(
    (att) => {
      const isProcessed = att.metadata?.processed;
      const isTemporary = att.isTemporary;
      return isProcessed || isTemporary;
    }
  );
  

  useEffect(() => {
    if (logsPanelRef.current) {
      if (isDocumentOpen) {
        logsPanelRef.current.resize(4);
      } else {
        logsPanelRef.current.resize(30);
      }
    }
  }, [isDocumentOpen]);

  if (!selectedFile && viewableAttachments.length === 0) {
    return (
      <div className="h-full">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={70} className="flex flex-col">
            <Card className="h-full rounded-none border-0 border-l border-b-0">
              <CardHeader>
                <CardTitle className="text-lg">Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                    <FileText className="h-10 w-10 text-primary/50" />
                  </div>
                  <h3 className="text-base font-medium mb-2">No Files Available</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Upload documents to start chatting with your content.
                  </p>
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel 
            ref={logsPanelRef}
            defaultSize={30}
            minSize={10}
            maxSize={70}
            collapsible={true}
            collapsedSize={4}
          >
            <LogsPanel logs={logs} isDocumentOpen={false} sessionId={sessionId} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  if (!selectedFile) {
    return (
      <div className="h-full">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={70} className="flex flex-col overflow-hidden">
            <Card className="h-full rounded-none border-0 border-l border-b-0 flex flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-lg">Files ({viewableAttachments.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="px-4 py-2 space-y-2">
              {viewableAttachments.map((att) => {
                const fileProgress = fileProcessingProgress?.[att.id];
                const bm25ProgressData = bm25Progress?.[att.id];
                const isFileProcessing = fileProgress?.status === 'processing' || fileProgress?.status === 'connected';
                const isBM25Processing = (att.bm25indexStatus === 'processing' || att.bm25indexStatus === 'queued') && bm25ProgressData?.status === 'processing';
                const progressValue = isFileProcessing ? fileProgress?.progress : isBM25Processing ? bm25ProgressData?.progress : undefined;
                
                if (att.isTemporary || progressValue !== undefined) {
                  console.log('[FilePanel] Progress:', {
                    filename: att.filename,
                    isTemporary: att.isTemporary,
                    fileProgress,
                    isFileProcessing,
                    isBM25Processing,
                    progressValue,
                  });
                }

                return (
                  <Card
                    key={att.id}
                    className={`p-3 hover:bg-muted/50 transition-colors mb-2 ${att.isTemporary ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {getFileIcon(att.filename)}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => !att.isTemporary && onDocumentClick?.(att)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate max-w-[350px]" title={att.filename}>{att.filename}</p>
                          {att.isTemporary && (
                            <Badge variant="outline" className="text-xs">
                              Uploading...
                            </Badge>
                          )}
                          {!att.isTemporary && att.bm25indexStatus === 'completed' && (
                            <Badge variant="secondary" className="text-xs">
                              BM25 Indexed
                            </Badge>
                          )}
                          {!att.isTemporary && isBM25Processing && (
                            <Badge variant="outline" className="text-xs">
                              {bm25ProgressData?.message || 'Indexing...'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(att.size / 1024).toFixed(1)} KB
                        </p>
                        
                        {progressValue !== undefined && (
                          <div className="mt-2">
                            <Progress value={progressValue} className="h-1" />
                          </div>
                        )}
                      </div>

                      {!att.isTemporary && (
                        <>
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
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel 
            ref={logsPanelRef}
            defaultSize={30}
            minSize={10}
            maxSize={70}
            collapsible={true}
            collapsedSize={4}
          >
            <LogsPanel logs={logs} isDocumentOpen={false} sessionId={sessionId} />
          </ResizablePanel>
        </ResizablePanelGroup>
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
    <div className="h-full">
      <ResizablePanelGroup direction="vertical" className="h-full">
        <ResizablePanel defaultSize={70} className="flex flex-col overflow-hidden">
          <Card className="h-full flex flex-col overflow-hidden rounded-none border-0 border-l border-b-0 gap-0">
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
              <FileViewer
                fileUrl={selectedFile.url}
                filename={selectedFile.filename}
                fileType={selectedFile.type || ''}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel 
          ref={logsPanelRef}
          defaultSize={30}
          minSize={10}
          maxSize={70}
          collapsible={true}
          collapsedSize={4}
        >
          <LogsPanel logs={logs} isDocumentOpen={true} sessionId={sessionId} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
