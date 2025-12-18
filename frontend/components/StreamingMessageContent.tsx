'use client';

import { useDeferredValue } from 'react';
import { MessageContent } from './MessageContent';

interface StreamingMessageContentProps {
  content: string;
  isStreaming: boolean;
  isComplete: boolean;
  onCitationClick?: (filename: string, page: number) => void;
}

export function StreamingMessageContent({ 
  content, 
  isStreaming, 
  isComplete,
  onCitationClick 
}: StreamingMessageContentProps) {
  const deferredContent = useDeferredValue(content);
  
  if (isStreaming) {
    return (
      <div className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
        {content}
        <span className="inline-block w-2 h-4 ml-1 bg-foreground animate-pulse" />
      </div>
    );
  }

  return (
    <MessageContent 
      content={deferredContent} 
      onCitationClick={onCitationClick} 
    />
  );
}
