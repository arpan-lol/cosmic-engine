import { FileText, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Citation } from '@/lib/citation-types';
import { getFileExtension, getFilenameWithoutExtension, truncateFilename } from '@/lib/citation-parser';

interface CitationButtonProps {
  citation: Citation;
  index: number;
  onCitationClick?: (filename: string, page: number) => void;
}

export function CitationButton({ citation, onCitationClick }: CitationButtonProps) {
  const extension = getFileExtension(citation.filename);
  const isPDF = extension === 'pdf';
  const filenameWithoutExt = getFilenameWithoutExtension(citation.filename);
  const truncatedName = truncateFilename(filenameWithoutExt);
  
  const firstPage = citation.pages.length > 0 ? citation.pages[0] : undefined;
  const hasPages = citation.pages.length > 0;
  
  const displayText = citation.pages.length > 1 
    ? `${truncatedName} (${citation.pages.length} refs)` 
    : hasPages && firstPage
      ? `${truncatedName} - p.${firstPage}`
      : truncatedName;
  
  const Icon = isPDF ? FileText : FileIcon;
  const isClickable = Boolean(onCitationClick && firstPage);
  
  const tooltipText = !hasPages
    ? `${citation.filename} (no page reference)` 
    : citation.pages.length > 1 
      ? `${citation.filename} (Pages: ${citation.pages.join(', ')})` 
      : `${citation.filename} - Page ${firstPage}`;
  
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 text-xs rounded-md border transition-colors whitespace-nowrap align-baseline',
        isClickable 
          ? 'hover:bg-accent hover:text-accent-foreground cursor-pointer border-border' 
          : 'cursor-not-allowed opacity-60 border-border/50'
      )}
      style={{ display: 'inline-flex', verticalAlign: 'baseline' }}
      onClick={isClickable ? () => onCitationClick!(citation.filename, firstPage!) : undefined}
      disabled={!isClickable}
      title={tooltipText}
      aria-label={`Citation: ${citation.filename}${firstPage ? `, page ${firstPage}` : ''}`}
      aria-disabled={!isClickable}
    >
      <Icon className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
      <span className="max-w-[200px] truncate">{displayText}</span>
    </button>
  );
}
