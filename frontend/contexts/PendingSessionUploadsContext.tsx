"use client";

import { ReactNode, createContext, useCallback, useContext, useMemo, useRef } from 'react';

interface PendingSessionUploadsContextType {
  setPendingUploads: (sessionId: string, files: File[]) => void;
  consumePendingUploads: (sessionId: string) => File[] | null;
  clearPendingUploads: (sessionId: string) => void;
}

const PendingSessionUploadsContext = createContext<PendingSessionUploadsContextType | undefined>(undefined);

export function PendingSessionUploadsProvider({ children }: { children: ReactNode }) {
  const pendingUploadsRef = useRef<Map<string, File[]>>(new Map());

  const setPendingUploads = useCallback((sessionId: string, files: File[]) => {
    pendingUploadsRef.current.set(sessionId, files);
  }, []);

  const consumePendingUploads = useCallback((sessionId: string) => {
    const files = pendingUploadsRef.current.get(sessionId);

    if (!files) {
      return null;
    }

    pendingUploadsRef.current.delete(sessionId);
    return files;
  }, []);

  const clearPendingUploads = useCallback((sessionId: string) => {
    pendingUploadsRef.current.delete(sessionId);
  }, []);

  const value = useMemo(
    () => ({
      setPendingUploads,
      consumePendingUploads,
      clearPendingUploads,
    }),
    [setPendingUploads, consumePendingUploads, clearPendingUploads]
  );

  return (
    <PendingSessionUploadsContext.Provider value={value}>
      {children}
    </PendingSessionUploadsContext.Provider>
  );
}

export function usePendingSessionUploads() {
  const context = useContext(PendingSessionUploadsContext);

  if (context === undefined) {
    throw new Error('usePendingSessionUploads must be used within a PendingSessionUploadsProvider');
  }

  return context;
}
