'use client';

import { Message, Attachment } from '@/lib/types';
import { formatDuration } from '@/lib/date-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Clock, Zap, Database, Cpu, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimingBreakdownModalProps {
  timeMetrics: NonNullable<Message['timeMetrics']>;
  attachments?: Attachment[];
  trigger: React.ReactNode;
}

interface TimingSection {
  title: string;
  icon: React.ReactNode;
  metrics: { label: string; value: number; color: string }[];
  totalMs: number;
}

export function TimingBreakdownModal({ timeMetrics, attachments, trigger }: TimingBreakdownModalProps) {
  const totalMs = timeMetrics.totalRequestMs;

  const calculatePercentage = (value: number) => {
    return totalMs > 0 ? (value / totalMs) * 100 : 0;
  };

  const getAttachmentName = (attachmentId: string): string => {
    if (!attachments || attachments.length === 0) {
      return attachmentId.substring(0, 8) + '...';
    }
    
    const attachment = attachments.find(a => a.id === attachmentId);
    
    const name = attachment?.filename || attachmentId;
    return name.length > 50 ? name.substring(0, 50) + '...' : name;
  };

  const sections: TimingSection[] = [];

  if (timeMetrics.queryExpansionMs) {
    sections.push({
      title: 'Query Expansion',
      icon: <FileText className="h-4 w-4" />,
      metrics: [
        {
          label: 'Query rewriting',
          value: timeMetrics.queryExpansionMs,
          color: 'bg-purple-500',
        },
      ],
      totalMs: timeMetrics.queryExpansionMs,
    });
  }

  if (timeMetrics.retrievalMs) {
    const retrievalMetrics: { label: string; value: number; color: string }[] = [];

    if (timeMetrics.embeddingMs) {
      retrievalMetrics.push({
        label: 'Query embedding',
        value: timeMetrics.embeddingMs,
        color: 'bg-blue-400',
      });
    }

    if (timeMetrics.vectorSearchMs) {
      retrievalMetrics.push({
        label: 'Vector search',
        value: timeMetrics.vectorSearchMs,
        color: 'bg-blue-500',
      });
    }

    if (timeMetrics.bm25SearchMs) {
      retrievalMetrics.push({
        label: 'BM25 search',
        value: timeMetrics.bm25SearchMs,
        color: 'bg-blue-600',
      });
    }

    if (timeMetrics.rankingMs) {
      retrievalMetrics.push({
        label: 'Result ranking',
        value: timeMetrics.rankingMs,
        color: 'bg-blue-700',
      });
    }

    if (timeMetrics.hydrationMs) {
      retrievalMetrics.push({
        label: 'Content hydration',
        value: timeMetrics.hydrationMs,
        color: 'bg-blue-300',
      });
    }

    if (retrievalMetrics.length === 0 && timeMetrics.retrievalMs) {
      retrievalMetrics.push({
        label: 'Context retrieval',
        value: timeMetrics.retrievalMs,
        color: 'bg-blue-500',
      });
    }

    sections.push({
      title: 'RAG Processing',
      icon: <Database className="h-4 w-4" />,
      metrics: retrievalMetrics,
      totalMs: timeMetrics.retrievalMs,
    });
  }

  if (timeMetrics.promptBuildingMs) {
    sections.push({
      title: 'Prompt Building',
      icon: <FileText className="h-4 w-4" />,
      metrics: [
        {
          label: 'System prompt construction',
          value: timeMetrics.promptBuildingMs,
          color: 'bg-yellow-500',
        },
      ],
      totalMs: timeMetrics.promptBuildingMs,
    });
  }

  const generationMetrics: { label: string; value: number; color: string }[] = [];

  if (timeMetrics.firstTokenMs) {
    generationMetrics.push({
      label: 'Time to first token',
      value: timeMetrics.firstTokenMs,
      color: 'bg-green-400',
    });
  }

  if (timeMetrics.streamingMs) {
    generationMetrics.push({
      label: 'Token streaming',
      value: timeMetrics.streamingMs,
      color: 'bg-green-500',
    });
  }

  if (timeMetrics.total) {
    generationMetrics.push({
      label: 'Total generation',
      value: timeMetrics.total,
      color: 'bg-green-600',
    });
  }

  if (generationMetrics.length > 0) {
    sections.push({
      title: 'LLM Generation',
      icon: <Cpu className="h-4 w-4" />,
      metrics: generationMetrics,
      totalMs: timeMetrics.total || timeMetrics.streamingMs || 0,
    });
  }

  const perAttachmentData =
    timeMetrics.perAttachmentMs && Object.keys(timeMetrics.perAttachmentMs).length > 0
      ? Object.entries(timeMetrics.perAttachmentMs).map(([attachmentId, metrics]) => ({
          attachmentId,
          ...metrics,
        }))
      : null;

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-border/80">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Response Performance Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Total Request Time
                </span>
                <span className="text-lg font-bold">{formatDuration(totalMs)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={100} className="h-2" />
            </CardContent>
          </Card>

          {sections.map((section, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {section.icon}
                    {section.title}
                  </span>
                  <span className="text-base">
                    {formatDuration(section.totalMs)} ({calculatePercentage(section.totalMs).toFixed(1)}%)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.metrics.map((metric, metricIdx) => (
                  <div key={metricIdx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="font-medium">
                        {formatDuration(metric.value)} ({calculatePercentage(metric.value).toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={calculatePercentage(metric.value)} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {perAttachmentData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Per Attachment Timing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {perAttachmentData.map((data, idx) => (
                  <div key={idx} className="border-l-2 border-muted pl-3 space-y-1">
                    <div className="font-medium text-sm truncate" title={data.attachmentId}>
                      {getAttachmentName(data.attachmentId)}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {data.embeddingMs && (
                        <div className="flex justify-between">
                          <span>Embedding:</span>
                          <span>{formatDuration(data.embeddingMs)}</span>
                        </div>
                      )}
                      {data.vectorSearchMs && (
                        <div className="flex justify-between">
                          <span>Vector search:</span>
                          <span>{formatDuration(data.vectorSearchMs)}</span>
                        </div>
                      )}
                      {data.bm25SearchMs && (
                        <div className="flex justify-between">
                          <span>BM25 search:</span>
                          <span>{formatDuration(data.bm25SearchMs)}</span>
                        </div>
                      )}
                      {data.totalMs && (
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>{formatDuration(data.totalMs)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
