'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useFileManagement } from '@/hooks/use-file-management';
import { useConversationState } from '@/hooks/use-conversation-state';
import { SessionHeader, MessageList, ChatInputArea } from './components';
import FilePanel from '@/components/FilePanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { useRef, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ChatSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const { data: authUser } = useAuth();

  const {
    sessionAttachments,
    isLoadingAttachments,
    mergedAttachments,
    selectedContextIds,
    setSelectedContextIds,
    selectedFile,
    setSelectedFile,
    deleteDialogOpen,
    flashTrigger,
    fileInputRef,
    bm25Progress,
    fileProcessingProgress,
    hasProcessingAttachments,
    hasBM25Indexing,
    handleFileUpload,
    handleCitationClick,
    handleAttachmentClick,
    handleDocumentClick,
    handleDeleteAttachment,
    confirmDeleteAttachment,
    cancelDeleteAttachment,
    triggerFileInput,
    clearFileInput,
  } = useFileManagement({ sessionId });

  const filePanelRef = useRef<ImperativePanelHandle>(null);
  const [isFilePanelCollapsed, setIsFilePanelCollapsed] = useState(false);

  const toggleFilePanel = useCallback(() => {
    const panel = filePanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }, []);

  const {
    conversation,
    isLoading,
    displayMessages,
    allLogs,
    displayTitle,
    isTypingTitle,
    seenMessageIds,
    messagesEndRef,
    isStreaming,
    isComplete,
    error,
    isLoadingResponse,
    handleSendMessage,
    reset,
  } = useConversationState({
    sessionId,
    sessionAttachments,
    selectedContextIds,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Conversation not found</p>
            <Button onClick={() => router.push('/dashboard/sessions')} className="mt-4">
              Back to Conversations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPlaceholder = () => {
    if (isStreaming) return 'Waiting for response...';
    if (isLoadingAttachments) return 'Loading...';
    if (hasProcessingAttachments) return 'Processing documents...';
    if (hasBM25Indexing) return 'Indexing files for BM25...';
    return 'Ask Anything';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={65} minSize={40} order={1}>
          <div className="flex flex-col h-full">
            <SessionHeader
              sessionId={sessionId}
              conversation={conversation}
              attachments={sessionAttachments || []}
              selectedIds={selectedContextIds}
              onSelectionChange={setSelectedContextIds}
              isLoadingAttachments={isLoadingAttachments}
              flashTrigger={flashTrigger}
              displayTitle={displayTitle}
              isTypingTitle={isTypingTitle}
              filePanelToggle={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFilePanel}
                  title={isFilePanelCollapsed ? 'Show file panel' : 'Hide file panel'}
                >
                  {isFilePanelCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
                </Button>
              }
            />

            <MessageList
              messages={displayMessages}
              sessionAttachments={sessionAttachments}
              userAvatar={authUser?.picture}
              userName={authUser?.name}
              seenMessageIds={seenMessageIds}
              isLoadingResponse={isLoadingResponse}
              isStreaming={isStreaming}
              isComplete={isComplete}
              messagesEndRef={messagesEndRef}
              onCitationClick={handleCitationClick}
              onAttachmentClick={handleAttachmentClick}
            />

            <ChatInputArea
              error={error}
              onDismissError={reset}
              fileInputRef={fileInputRef}
              onFileChange={handleFileUpload}
              onClearFileInput={clearFileInput}
              onSendMessage={handleSendMessage}
              onAttachmentClick={triggerFileInput}
              disabled={isStreaming || isLoadingAttachments || hasProcessingAttachments || hasBM25Indexing}
              loading={isLoadingAttachments}
              selectedFilesCount={selectedContextIds.length}
              placeholder={getPlaceholder()}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          ref={filePanelRef}
          defaultSize={35}
          minSize={20}
          maxSize={50}
          collapsible={true}
          collapsedSize={0}
          order={2}
          onCollapse={() => setIsFilePanelCollapsed(true)}
          onExpand={() => setIsFilePanelCollapsed(false)}
        >
          <FilePanel
            attachments={mergedAttachments}
            selectedFile={selectedFile}
            onClose={() => setSelectedFile(undefined)}
            onDocumentClick={handleDocumentClick}
            onDeleteAttachment={handleDeleteAttachment}
            bm25Progress={bm25Progress}
            fileProcessingProgress={fileProcessingProgress}
            logs={allLogs}
            sessionId={sessionId}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <AlertDialog open={deleteDialogOpen} onOpenChange={cancelDeleteAttachment}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAttachment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
