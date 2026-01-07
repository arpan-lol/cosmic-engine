"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface FileViewerContextType {
  isFileViewerOpen: boolean;
  setIsFileViewerOpen: (open: boolean) => void;
}

const FileViewerContext = createContext<FileViewerContextType | undefined>(undefined);

export function FileViewerProvider({ children }: { children: ReactNode }) {
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);

  return (
    <FileViewerContext.Provider value={{ isFileViewerOpen, setIsFileViewerOpen }}>
      {children}
    </FileViewerContext.Provider>
  );
}

export function useFileViewer() {
  const context = useContext(FileViewerContext);
  if (context === undefined) {
    throw new Error('useFileViewer must be used within a FileViewerProvider');
  }
  return context;
}
