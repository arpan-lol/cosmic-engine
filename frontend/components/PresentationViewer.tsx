'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileX, ExternalLink } from 'lucide-react';

interface PresentationViewerProps {
  fileUrl: string;
  filename: string;
}

export default function PresentationViewer({ fileUrl, filename }: PresentationViewerProps) {
  const [viewerType, setViewerType] = useState<'google' | 'office' | null>('google');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    link.click();
  };

  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

  if (!viewerType) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
        <FileX className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-sm mb-2">Choose a viewer for this presentation</p>
        <div className="flex gap-2">
          <Button onClick={() => setViewerType('google')} variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Google Docs Viewer
          </Button>
          <Button onClick={() => setViewerType('office')} variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Office Online
          </Button>
        </div>
        <Button onClick={handleDownload} variant="outline" className="mt-4">
          <Download className="h-4 w-4 mr-2" />
          Or download to view
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-hidden bg-muted/30 rounded-lg">
        <iframe
          src={viewerType === 'google' ? googleViewerUrl : officeViewerUrl}
          className="w-full h-full border-0"
          title={`${filename} preview`}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
      <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-3 flex items-center gap-2 z-10">
        <Button 
          onClick={() => setViewerType(viewerType === 'google' ? 'office' : 'google')} 
          size="sm" 
          variant="outline"
        >
          Switch to {viewerType === 'google' ? 'Office' : 'Google'}
        </Button>
        <Button onClick={handleDownload} size="sm" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </Card>
    </div>
  );
}
