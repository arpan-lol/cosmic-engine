'use client';

import {  useSyncExternalStore } from 'react';

export interface SearchOptions {
  hybridSearch: boolean;
  rrfSearch: boolean;
  caching: boolean;
queryExpansion?: {
  enabled: boolean
  temperature: number
  }
}

const DEFAULT_OPTIONS: SearchOptions = {
  hybridSearch: false,
  rrfSearch: false,
  caching: false
};

const STORAGE_KEY = 'cosmic-engine-search-options';

// Singleton store for search options
class SearchOptionsStore {
  private listeners = new Set<() => void>();
  private options: SearchOptions = DEFAULT_OPTIONS;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.options = { ...DEFAULT_OPTIONS, ...JSON.parse(stored) };
      }
      this.isInitialized = true;
    } catch (e) {
      console.error('Failed to parse search options from localStorage', e);
    }
  }

  getOptions(): SearchOptions {
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.loadFromStorage();
    }
    return this.options;
  }

  setOptions(newOptions: Partial<SearchOptions>) {
    this.options = { ...this.options, ...newOptions };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.options));
    }
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

const store = new SearchOptionsStore();

export function useSearchOptions() {
  const options = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getOptions(),
    () => DEFAULT_OPTIONS
  );

  const updateOptions = (newOptions: Partial<SearchOptions>) => {
    store.setOptions(newOptions);
  };

  const toggleHybridSearch = () => {
    store.setOptions({ hybridSearch: !store.getOptions().hybridSearch });
  };

  const disableHybridSearch = () => {
    store.setOptions({ hybridSearch: false });
  };

  const toggleRrfSearch = () => {
    store.setOptions({ rrfSearch: !store.getOptions().rrfSearch });
  };

  const disableRrfSearch = () => {
    store.setOptions({ rrfSearch: false });
  };

  const toggleKeywordCaching = () => {
    store.setOptions({ caching: !store.getOptions().caching });
  };

  const disableCaching = () => {
    store.setOptions({ caching: false });
  };

  return {
    options,
    updateOptions,
    toggleHybridSearch,
    disableHybridSearch,
    toggleRrfSearch,
    disableRrfSearch,
    toggleKeywordCaching,
    disableCaching,
    isLoaded: true, // Always loaded with sync external store
  };
}
