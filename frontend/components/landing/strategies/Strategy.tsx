'use client';

import React from 'react';
import { Command, Cpu, ScanText } from 'lucide-react';
import { HybridSearch } from './HybridSearch';
import { Rrf } from './Rrf';
import { Caching } from './Caching';
import { QueryExpansion } from './QueryExpansion';
import { ComingSoon } from './ComingSoon';

export function Strategy({ title }: { title: string }) {
  if (title === 'Hybrid Search') return <HybridSearch />;
  if (title === 'Reciprocal Rank Fusion') return <Rrf />;
  if (title === 'Caching') return <Caching />;
  if (title === 'Query Expansion') return <QueryExpansion />;
  if (title === 'HyDE') return <ComingSoon icon={Cpu} subtitle="Hypothetical Document Embeddings" />;
  if (title === 'Contextual Chunking') return <ComingSoon icon={ScanText} subtitle="Contextual Chunking" />;

  return (
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <Command className="w-12 h-12 text-primary" />
      <span className="text-primary font-mono text-lg tracking-wide">[ Animation Placeholder ]</span>
      <span className="text-gray-500 font-mono text-sm">Visualizing {title}</span>
    </div>
  );
}
