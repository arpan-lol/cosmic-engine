'use client';

import { Loader2, Plus } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface ConversationsListProps {
  conversations: any[];
  isLoading: boolean;
  editingConversationId: string | null;
  editingTitle: string;
  activeConversationId: string | null;
  onCreateConversation: () => void;
  onEditStart: (id: string, title: string, e: React.MouseEvent) => void;
  onEditSave: (id: string, e?: React.MouseEvent) => void;
  onEditCancel: (e?: React.MouseEvent) => void;
  onEditChange: (value: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isCreating: boolean;
  isDeleting: boolean;
}

export function ConversationsList({
  conversations,
  isLoading,
  editingConversationId,
  editingTitle,
  activeConversationId,
  onCreateConversation,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  onDelete,
  isCreating,
  isDeleting,
}: ConversationsListProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between px-0">
        <span>{conversations?.length || 0} conversations</span>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full border border-border/60 shadow-sm"
          onClick={onCreateConversation}
          disabled={isCreating}
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0 border-t border-border/50">
          {isLoading && (
            <div className="px-2 py-3 text-sm text-muted-foreground">Loading...</div>
          )}
          {conversations?.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isEditing={editingConversationId === conversation.id}
              isActive={activeConversationId === conversation.id}
              editingTitle={editingTitle}
              onEditStart={onEditStart}
              onEditSave={onEditSave}
              onEditCancel={onEditCancel}
              onEditChange={onEditChange}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          ))}
          {!isLoading && conversations?.length === 0 && (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              No conversations yet
            </div>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
