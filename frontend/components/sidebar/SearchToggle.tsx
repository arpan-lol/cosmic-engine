'use client';

import { CircleHelp, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface SearchToggleProps {
  id: string;
  label: string;
  helpText: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  isLoading?: boolean;
  action?: React.ReactNode;
}

export function SearchToggle({
  id,
  label,
  helpText,
  checked,
  onCheckedChange,
  isLoading = false,
  action
}: SearchToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-1.5">
        <HoverCard>
          <HoverCardTrigger asChild>
            <CircleHelp className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-pointer" />
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="prose prose-sm dark:prose-invert text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {helpText}
              </ReactMarkdown>
            </div>
          </HoverCardContent>
        </HoverCard>
        <Label htmlFor={id} className="text-sm cursor-pointer">
          {label}
        </Label>

        {action && (
          <div className="text-sm text-muted-foreground">
            {action}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
        )}
      </div>
    </div>
  );
}
