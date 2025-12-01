'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, X, ArrowLeft } from 'lucide-react';

const PDFViewer = dynamic(() => import('./PDFViewer'), {
  loading: () => <div>Loading PDF...</div>,
});

interface Attachment {
  id: string;
  filename: string;
  type: string;
  url: string;
  size: number;
  metadata?: {
    processed?: boolean;
  };
}

interface FilePanelProps {
  attachments: Attachment[];
  selectedFile?: { filename: string; url: string; targetPage?: number };
  onClose?: () => void;
  onDocumentClick?: (attachment: Attachment) => void;
}

export default function FilePanel({ attachments, selectedFile, onClose, onDocumentClick }: FilePanelProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const pdfAttachments = attachments.filter(
    (att) => att.filename.toLowerCase().endsWith('.pdf') && att.metadata?.processed
  );

  if (!selectedFile && pdfAttachments.length === 0) {
    return (
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
    );
  }

  if (!selectedFile) {
    return (
      <Card className="h-full rounded-none border-0 border-l">
        <CardHeader>
          <CardTitle className="text-lg">Documents ({pdfAttachments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {pdfAttachments.map((att) => (
                <Card
                  key={att.id}
                  className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onDocumentClick?.(att)}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{att.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {(att.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
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
          targetPage={selectedFile.targetPage}
          onPageChange={setCurrentPage}
        />
      </CardContent>
    </Card>
  );
}
