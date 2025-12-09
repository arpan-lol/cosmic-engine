'use client';

import { useEffect, useState } from 'react';

export interface SearchOptions {
  hybridSearch: boolean;
}

const DEFAULT_OPTIONS: SearchOptions = {
  hybridSearch: false,
};

const STORAGE_KEY = 'cosmic-engine-search-options';

export function useSearchOptions() {
  const [options, setOptions] = useState<SearchOptions>(DEFAULT_OPTIONS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setOptions({ ...DEFAULT_OPTIONS, ...parsed });
      } catch (e) {
        console.error('Failed to parse search options from localStorage', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateOptions = (newOptions: Partial<SearchOptions>) => {
    const updated = { ...options, ...newOptions };
    setOptions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleHybridSearch = () => {
    updateOptions({ hybridSearch: !options.hybridSearch });
  };

  return {
    options,
    updateOptions,
    toggleHybridSearch,
    isLoaded,
  };
}
