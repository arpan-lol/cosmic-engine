'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { EngineEvent } from '@/lib/types';
import { AlertCircle, CheckCircle2, Info, ExternalLink } from 'lucide-react';
import ChunkViewer from './ChunkViewer';
import { ImperativePanelHandle } from 'react-resizable-panels';

interface LogsPanelProps {
  logs: EngineEvent[];
  isDocumentOpen: boolean;
  sessionId: string;
}

export default function LogsPanel({ logs, isDocumentOpen, sessionId }: LogsPanelProps) {
  const [panelSize, setPanelSize] = useState(100);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsPanelRef = useRef<ImperativePanelHandle>(null);
  const [chunkViewerOpen, setChunkViewerOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EngineEvent | null>(null);

  useEffect(() => {
    if (logsPanelRef.current) {
      if (isDocumentOpen) {
        logsPanelRef.current.resize(4);
      } else {
        logsPanelRef.current.resize(100);
      }
    }
  }, [isDocumentOpen]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleViewChunks = (log: EngineEvent) => {
    setSelectedLog(log);
    setChunkViewerOpen(true);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="absolute inset-x-0 bottom-0 h-full pointer-events-none z-10 border-l">
      <ResizablePanelGroup direction="vertical" className="h-full">
        <ResizablePanel defaultSize={100 - panelSize} className="pointer-events-none" />
        <ResizableHandle withHandle className="pointer-events-auto bg-border" />
        <ResizablePanel 
          ref={logsPanelRef}
          defaultSize={panelSize}
          minSize={10}
          maxSize={70}
          className="pointer-events-auto"
          collapsible={true}
          collapsedSize={4}
          onResize={(size) => setPanelSize(size)}
        >
          <Card className="h-full flex flex-col rounded-none border-0 border-t overflow-hidden bg-background">
            <CardHeader className="px-4 py- flex-shrink-0">
              <CardTitle className="text-sm font-medium">Engine Logs</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="px-4 pb-4 pt-2 space-y-2">
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                      No logs yet
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div
                        key={`${log.timestamp}-${index}`}
                        className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-xs"
                      >
                        {log.type === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : log.type === 'notification' ? (
                          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        ) : log.type === 'title-update' ? (
                          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{log.message}</span>
                            {log.actionType === 'view-chunks' && log.attachmentId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => handleViewChunks(log)}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                            <span className="text-muted-foreground text-[10px] ml-auto">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          {log.data && (
                            <div className="mt-1 space-y-1">
                              {log.data.title && (
                                <p className="text-muted-foreground font-medium">{log.data.title}</p>
                              )}
                              {log.data.body && log.data.body.length > 0 && (
                                <ul className="text-muted-foreground space-y-0.5 ml-2">
                                  {log.data.body.map((item, i) => (
                                    <li key={i} className="text-[11px]">• {item}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
      {selectedLog && selectedLog.attachmentId && (
        <ChunkViewer
          open={chunkViewerOpen}
          onOpenChange={setChunkViewerOpen}
          sessionId={sessionId}
          attachmentId={selectedLog.attachmentId}
          filename={selectedLog.message.split(' ')[0]}
        />
      )}
    </div>
  );
}
