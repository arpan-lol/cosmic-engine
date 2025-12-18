'use client';

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';
import Image from 'next/image';

interface ImageViewerProps {
  fileUrl: string;
  filename: string;
}

export default function ImageViewer({ fileUrl, filename }: ImageViewerProps) {
  return (
    <div className="flex flex-col h-full relative">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="flex-1 overflow-hidden bg-muted/30 rounded-lg flex items-center justify-center">
              <TransformComponent
                wrapperClass="w-full h-full flex items-center justify-center"
                contentClass="flex items-center justify-center"
              >
                <img
                  src={fileUrl}
                  alt={filename}
                  className="max-w-full max-h-full object-contain"
                  style={{ imageRendering: 'auto' }}
                />
              </TransformComponent>
            </div>
            <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-3 flex flex-row items-center gap-2 z-10">
              <Button onClick={() => zoomOut()} size="sm" variant="outline">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button onClick={() => zoomIn()} size="sm" variant="outline">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button onClick={() => resetTransform()} size="sm" variant="outline">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </Card>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
