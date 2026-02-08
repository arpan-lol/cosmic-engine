'use client';

import { RefObject, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ChatComposer from '@/components/ChatComposer';

interface ChatInputAreaProps {
  error: string | null;
  onDismissError: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (files: FileList | File[]) => void;
  onClearFileInput: () => void;
  onSendMessage: (content: string) => void;
  onAttachmentClick: () => void;
  disabled: boolean;
  loading: boolean;
  selectedFilesCount: number;
  placeholder: string;
}

export function ChatInputArea({
  error,
  onDismissError,
  fileInputRef,
  onFileChange,
  onClearFileInput,
  onSendMessage,
  onAttachmentClick,
  disabled,
  loading,
  selectedFilesCount,
  placeholder,
}: ChatInputAreaProps) {
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileChange(files);
    }
    onClearFileInput();
  };

  return (
    <div className="flex-shrink-0 space-y-2 p-2">
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-3 text-sm text-destructive flex items-start justify-between gap-2">
            <span>Error! The server might be overloaded. Please try again.</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 -mt-0.5 hover:bg-destructive/10"
              onClick={onDismissError}
            >
              <span className="sr-only">Dismiss error</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        className="hidden"
        accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        multiple
      />

      <ChatComposer
        onSend={onSendMessage}
        onAttachmentClick={onAttachmentClick}
        disabled={disabled}
        loading={loading}
        selectedFilesCount={selectedFilesCount}
        placeholder={placeholder}
      />
    </div>
  );
}
