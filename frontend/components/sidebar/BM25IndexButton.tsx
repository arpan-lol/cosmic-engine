'use client';

import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { HelpContent } from '@/components/HelpContent';
import { HELP_TEXTS } from '@/lib/help-texts';

interface BM25IndexButtonProps {
  onClick: () => void;
}

export function BM25IndexButton({ onClick }: BM25IndexButtonProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center h-11"
          onClick={onClick}
        >
          <span>Index Files for BM25</span>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <HelpContent content={HELP_TEXTS.BM25_INDEXING} />
      </HoverCardContent>
    </HoverCard>
  );
}
