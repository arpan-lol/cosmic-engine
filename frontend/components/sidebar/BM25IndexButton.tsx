'use client';

import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import ReactMarkdown from 'react-markdown';

const BM25_INDEXING_HELP = `
### BM25 Indexing

BM25 indexing extracts **keywords** and **term statistics** so the system can perform keyword-based searches.

 • Essential for Hybrid Search and RRF  
 • One-time processing per file  
 • Enables fast keyword matching  
`;

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
        <div className="prose prose-invert text-sm whitespace-pre-wrap">
          <ReactMarkdown>{BM25_INDEXING_HELP}</ReactMarkdown>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
