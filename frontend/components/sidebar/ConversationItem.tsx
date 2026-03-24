'use client';

import { MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react';
import { SidebarMenuItem } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMessageDateTime, formatRelativeDateTime } from '@/lib/date-utils';

interface ConversationItemProps {
  conversation: {
    id: string;
    title?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  isEditing: boolean;
  isActive?: boolean;
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
  isActive = false,
  editingTitle,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  onDelete,
  isDeleting
}: ConversationItemProps) {
  return (
    <SidebarMenuItem className="group/menu-item border-b border-border/50 last:border-b-0">
      {isEditing ? (
        <div className="flex items-center gap-2 px-2 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <Input
            value={editingTitle}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSave(conversation.id);
              if (e.key === 'Escape') onEditCancel();
            }}
            className="h-9 text-sm"
            autoFocus
            maxLength={100}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 rounded-full border border-border/60 bg-background"
            onClick={(e) => onEditSave(conversation.id, e)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 rounded-full border border-border/60 bg-background"
            onClick={onEditCancel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div
          className={`flex items-start gap-2 px-2 py-3 transition-colors ${isActive ? 'bg-sidebar-accent/70' : 'hover:bg-sidebar-accent/45'}`}
        >
          <a href={`/dashboard/sessions/${conversation.id}`} className="flex min-w-0 flex-1 items-start gap-3">
            <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition-colors ${isActive ? 'text-foreground' : ''}`}>
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {conversation.title || 'Untitled Conversation'}
              </div>
              {(conversation.updatedAt || conversation.createdAt) && (
                <div
                  className="mt-1 text-xs text-muted-foreground"
                  title={formatMessageDateTime(conversation.updatedAt || conversation.createdAt || '')}
                >
                  {formatRelativeDateTime(conversation.updatedAt || conversation.createdAt || '')}
                </div>
              )}
            </div>
          </a>
          <div className="flex items-center gap-1 opacity-100 transition-all sm:translate-x-1 sm:opacity-0 sm:group-hover/menu-item:translate-x-0 sm:group-hover/menu-item:opacity-100 sm:group-focus-within/menu-item:translate-x-0 sm:group-focus-within/menu-item:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full border border-transparent bg-background/80 text-muted-foreground shadow-sm hover:border-border/80 hover:bg-background hover:text-foreground"
                onClick={(e) => onEditStart(conversation.id, conversation.title || '', e)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full border border-transparent bg-background/80 text-muted-foreground shadow-sm hover:border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
                onClick={(e) => onDelete(conversation.id, e)}
                disabled={isDeleting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
          </div>
        </div>
      )}
    </SidebarMenuItem>
  );
}
