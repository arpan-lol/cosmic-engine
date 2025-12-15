'use client';

import { useState } from 'react';
import { MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConversationItemProps {
  conversation: {
    id: string;
    title?: string;
  };
  isEditing: boolean;
  editingTitle: string;
  onEditStart: (id: string, title: string, e: React.MouseEvent) => void;
  onEditSave: (id: string, e?: React.MouseEvent) => void;
  onEditCancel: (e?: React.MouseEvent) => void;
  onEditChange: (value: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isDeleting: boolean;
}

export function ConversationItem({
  conversation,
  isEditing,
  editingTitle,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  onDelete,
  isDeleting
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <SidebarMenuItem 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditing ? (
        <div className="flex items-center gap-1 px-2 py-1" onClick={(e) => e.stopPropagation()}>
          <Input
            value={editingTitle}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSave(conversation.id);
              if (e.key === 'Escape') onEditCancel();
            }}
            className="h-7 text-sm"
            autoFocus
            maxLength={100}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={(e) => onEditSave(conversation.id, e)}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={onEditCancel}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1 w-full">
          <SidebarMenuButton asChild className="cursor-pointer flex-1">
            <a href={`/dashboard/sessions/${conversation.id}`} className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{conversation.title || 'Untitled Conversation'}</span>
            </a>
          </SidebarMenuButton>
          {isHovered && (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => onEditStart(conversation.id, conversation.title || '', e)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => onDelete(conversation.id, e)}
                disabled={isDeleting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </SidebarMenuItem>
  );
}
