'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import AttachmentSelector from '@/components/AttachmentSelector';
import type { Attachment, Conversation } from '@/lib/types';
import type { ReactNode } from 'react';

interface SessionHeaderProps {
  sessionId: string;
  conversation: Conversation;
  attachments: Attachment[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  isLoadingAttachments: boolean;
  flashTrigger: number;
  displayTitle: string;
  isTypingTitle: boolean;
  filePanelToggle?: ReactNode;
}

export function SessionHeader({
  sessionId,
  conversation,
  attachments,
  selectedIds,
  onSelectionChange,
  isLoadingAttachments,
  flashTrigger,
  displayTitle,
  isTypingTitle,
  filePanelToggle,
}: SessionHeaderProps) {
  const router = useRouter();

  return (
    <Card className="border-0 border-b p-0 bg-background flex-shrink-0 rounded-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/sessions')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <CardTitle className="truncate">
                {isTypingTitle ? displayTitle : (conversation.title || 'Untitled Conversation')}
                {isTypingTitle && <span className="animate-pulse">|</span>}
              </CardTitle>
              <p
                className="text-sm text-muted-foreground truncate"
                title={new Date(conversation.createdAt).toLocaleString('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              >
                Created {new Date(conversation.createdAt).toLocaleDateString()} at {new Date(conversation.createdAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <AttachmentSelector
              sessionId={sessionId}
              attachments={attachments}
              selectedIds={selectedIds}
              onSelectionChange={onSelectionChange}
              isLoading={isLoadingAttachments}
              flashTrigger={flashTrigger}
            />
            {filePanelToggle}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
