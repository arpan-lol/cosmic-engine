'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  targetPage?: number;
  onPageChange?: (pageNumber: number) => void;
}

export default function PDFViewer({ fileUrl, targetPage, onPageChange }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Track scroll position to update current page
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const containerMiddle = containerTop + containerHeight / 2;

      // Find which page is in the middle of the viewport
      for (let i = 1; i <= numPages; i++) {
        const pageEl = pageRefs.current[i];
        if (pageEl) {
          const rect = pageEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const pageTop = rect.top - containerRect.top + containerTop;
          const pageBottom = pageTop + rect.height;

          if (containerMiddle >= pageTop && containerMiddle <= pageBottom) {
            if (pageNumber !== i) {
              setPageNumber(i);
              onPageChange?.(i);
            }
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [numPages, pageNumber, onPageChange]);

  useEffect(() => {
    if (targetPage && targetPage !== pageNumber && targetPage <= numPages && numPages > 0) {
      setPageNumber(targetPage);
      setTimeout(() => {
        const pageEl = pageRefs.current[targetPage];
        if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [targetPage, numPages]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  const changePage = useCallback((offset: number) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      onPageChange?.(newPage);
      const pageEl = pageRefs.current[newPage];
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [pageNumber, numPages, onPageChange]);

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  }

  function zoomOut() {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  }

  return (
    <div className="flex flex-col h-full">
      <Card className="p-3 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            size="sm"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages || '...'}
          </span>
          <Button
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            size="sm"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={zoomOut} size="sm" variant="outline">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button onClick={zoomIn} size="sm" variant="outline">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4"
      >
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        <div className="flex flex-col items-center gap-4">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error('PDF load error:', error)}
            loading={<Loader2 className="h-8 w-8 animate-spin" />}
          >
            {Array.from(new Array(numPages), (el, index) => {
              const page = index + 1;
              return (
                <div
                  key={`page_${page}`}
                  ref={(el) => { pageRefs.current[page] = el; }}
                  data-page-number={page}
                >
                  <Page
                    pageNumber={page}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="mb-4 shadow-lg"
                  />
                </div>
              );
            })}
          </Document>
        </div>
      </div>
    </div>
  );
}
