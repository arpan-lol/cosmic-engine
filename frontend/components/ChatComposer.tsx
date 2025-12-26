'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatComposerProps {
  onSend: (content: string) => void;
  onAttachmentClick?: () => void;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
  selectedFilesCount?: number;
}

export default function ChatComposer({
  onSend,
  onAttachmentClick,
  disabled = false,
  placeholder = 'Type your message...',
  loading = false,
  selectedFilesCount = 0,
}: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 pb-4">
      {/* {selectedFilesCount > 0 && (
        <div className="flex justify-center mb-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-accent/50 rounded-full text-xs text-accent-foreground border">
            <Paperclip className="h-3 w-3" />
            <span>{selectedFilesCount} file{selectedFilesCount !== 1 ? 's' : ''} selected</span>
          </div>
        </div>
      )} */}
      <div
        className={cn(
          "relative flex items-center gap-2 rounded-[28px] border bg-background px-1 py-1",
          "shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.08)]",
          "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.32)]",
          "focus-within:border-foreground/20 transition-colors"
        )}
      >
        <button
          type="button"
          onClick={onAttachmentClick}
          disabled={disabled}
          aria-label="Add attachments"
          className={cn(
            "flex-shrink-0 flex items-center justify-center",
            "h-9 w-9 rounded-full ml-0.5",
            "text-muted-foreground hover:cursor-pointer",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Paperclip className="h-5 w-5 " />
        </button>

        <div className="flex-1 min-w-0 max-h-[200px] overflow-y-auto flex items-center">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            aria-label="Message input"
            className={cn(
              "w-full resize-none bg-transparent",
              "text-sm leading-6 outline-none",
              "placeholder:text-muted-foreground ",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "py-2 px-1"
            )}
            style={{ 
              height: 'auto',
              minHeight: '24px',
              maxHeight: '200px',
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          aria-label="Send message"
          className={cn(
            "flex-shrink-0 flex items-center justify-center",
            "h-9 w-9 rounded-full mr-0.5",
            "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:cursor-pointer",
            message.trim() && !disabled
              ? "bg-accent text-accent-foreground hover:bg-accent/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Send className="h-5 w-5r" />
        </button>
      </div>
    </div>
  );
}
