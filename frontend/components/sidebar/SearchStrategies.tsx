'use client';

import { SearchToggle } from './SearchToggle';
import { BM25IndexButton } from './BM25IndexButton';
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar';

const HYBRID_SEARCH_HELP = `
### Hybrid Search
Combines semantic similarity **(vector search)** and keyword relevance **(BM25)**.

 • Vector search understands meaning  
 • BM25 boosts important terms  
 • Helps retrieve both precise and context-rich chunks  
`;

const RRF_SEARCH_HELP = `
Reciprocal Rank Fusion (RRF) is a simple, powerful scoring method used to combine results from multiple search systems: like BM25 + embeddings + hybrid models - into one ranked list.

RRF says: "If multiple systems rank a document highly, even if their scores differ, boost it heavily."

Instead of using raw scores (which may not be comparable), it uses rank positions only.
`;

interface SearchStrategiesProps {
  options: {
    hybridSearch: boolean;
    rrfSearch: boolean;
  };
  onHybridSearchToggle: (checked: boolean) => void;
  onRrfSearchToggle: (checked: boolean) => void;
  onBM25ButtonClick: () => void;
  isCheckingBM25: boolean;
  isCheckingRRF: boolean;
}

export function SearchStrategies({
  options,
  onHybridSearchToggle,
  onRrfSearchToggle,
  onBM25ButtonClick,
  isCheckingBM25,
  isCheckingRRF,
}: SearchStrategiesProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-0">Search Strategies</SidebarGroupLabel>
      <SidebarGroupContent className="space-y-3">
        <div className="px-2">
          <SearchToggle
            id="hybrid-search"
            label="Hybrid Search"
            helpText={HYBRID_SEARCH_HELP}
            checked={options.hybridSearch}
            onCheckedChange={onHybridSearchToggle}
            isLoading={isCheckingBM25}
          />
        </div>

        <div className="px-2">
          <SearchToggle
            id="rrf-search"
            label="Reciprocal Rank Fusion"
            helpText={RRF_SEARCH_HELP}
            checked={options.rrfSearch}
            onCheckedChange={onRrfSearchToggle}
            isLoading={isCheckingRRF}
          />
        </div>

        <div className="px-2">
          <BM25IndexButton onClick={onBM25ButtonClick} />
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
