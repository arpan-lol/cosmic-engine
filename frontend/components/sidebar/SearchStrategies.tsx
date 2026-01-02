'use client';

import { SearchToggle } from './SearchToggle';
import { BM25IndexButton } from './BM25IndexButton';
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar';
import { HELP_TEXTS } from '@/lib/help-texts';

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
            helpText={HELP_TEXTS.HYBRID_SEARCH}
            checked={options.hybridSearch}
            onCheckedChange={onHybridSearchToggle}
            isLoading={isCheckingBM25}
          />
        </div>

        <div className="px-2">
          <SearchToggle
            id="rrf-search"
            label="Reciprocal Rank Fusion"
            helpText={HELP_TEXTS.RRF_SEARCH}
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
