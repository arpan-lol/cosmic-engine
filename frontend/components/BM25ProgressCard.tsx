'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { XCircle } from 'lucide-react';

interface StreamStatus {
  status: 'connected' | 'processing' | 'completed' | 'error';
  step?: string;
  message?: string;
  progress?: number;
  phase?: string;
  error?: string;
}

interface BM25ProgressCardProps {
  attachmentId: string;
  filename: string;
  progressData: StreamStatus;
}

export default function BM25ProgressCard({ filename, progressData }: BM25ProgressCardProps) {
  const isProcessing = progressData.status === 'connected' || progressData.status === 'processing';
  const isCompleted = progressData.status === 'completed';
  const hasError = progressData.status === 'error';

  const progress = progressData.progress || 0;
  const message = progressData.message || `Indexing ${filename}...`;

  console.log('[BM25ProgressCard]', { filename, status: progressData.status, progress, isProcessing, isCompleted, hasError });

  if (isCompleted) {
    console.log('[BM25ProgressCard] Hiding because completed');
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

      {hasError && (
        <Card className="w-full">
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
