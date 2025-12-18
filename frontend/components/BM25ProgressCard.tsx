'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { XCircle, CheckCircle } from 'lucide-react';
import { StreamStatus } from '@/lib/types';

interface BM25ProgressCardProps {
  filename: string;
  progressData: StreamStatus;
}

export default function BM25ProgressCard({ filename, progressData }: BM25ProgressCardProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const isBM25Phase = !progressData.phase || progressData.phase === 'bm25';
  const isProcessing = (progressData.status === 'connected' || progressData.status === 'processing') && isBM25Phase;
  const isCompleted = progressData.status === 'completed' && isBM25Phase;
  const hasError = progressData.status === 'error' && isBM25Phase;

  const progress = progressData.progress || 0;
  const message = progressData.message || `Indexing ${filename}...`;

  useEffect(() => {
    if (isCompleted) {
      setShowCompleted(true);
      const timer = setTimeout(() => {
        setShowCompleted(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  if (!isBM25Phase) {
    return null;
  }

  if (isCompleted && !showCompleted) {
    return null;
  }

  return (
    <>
      {isProcessing && (
        <Card className="w-full">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {message}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">
                  {Math.round(progress)}%
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              {progressData.step && (
                <div className="text-xs text-muted-foreground">
                  {progressData.step}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {showCompleted && isCompleted && (
        <Card className="w-full border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <div className="text-sm font-medium truncate">
                {filename}: BM25 indexing complete!
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasError && (
        <Card className="w-full border-red-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <div className="text-sm truncate">
                {filename}: {progressData.error || 'BM25 indexing failed'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
