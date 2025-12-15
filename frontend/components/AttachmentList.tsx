import { FileText } from 'lucide-react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AttachmentListProps {
  attachments: Message['attachments'];
  onAttachmentClick?: (filename: string) => void;
}

export function AttachmentList({ attachments, onAttachmentClick }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div 
      className="inline-flex flex-wrap gap-1" 
      role="list" 
      aria-label={`${attachments.length} attachment${attachments.length > 1 ? 's' : ''}`}
    >
      {attachments.map((attachment, index) => (
        <button
          key={attachment.id || `attachment-${index}`}
          type="button"
          role="listitem"
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 text-xs rounded-md border transition-colors whitespace-nowrap align-baseline',
            'hover:bg-background hover:text-foreground cursor-pointer border-border'
          )}
          style={{ display: 'inline-flex', verticalAlign: 'baseline' }}
          title={attachment.filename}
          aria-label={`Attachment: ${attachment.filename}`}
          onClick={() => onAttachmentClick?.(attachment.filename)}
        >
          <FileText className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
          <span className="max-w-[200px] truncate">{attachment.filename}</span>
        </button>
      ))}
    </div>
  );
}
