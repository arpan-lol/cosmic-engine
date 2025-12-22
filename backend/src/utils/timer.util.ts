export interface RetrievalBreakdown {
  embeddingMs?: number;
  vectorSearchMs?: number;
  bm25SearchMs?: number;
  rankingMs?: number;
  hydrationMs?: number;
  perAttachment?: {
    [attachmentId: string]: {
      embeddingMs?: number;
      vectorSearchMs?: number;
      bm25SearchMs?: number;
      totalMs?: number;
    };
  };
}

export interface TimingMetrics {
  totalRequestMs: number;
  queryExpansionMs?: number;
  retrievalMs?: number;
  retrievalBreakdown?: RetrievalBreakdown;
  promptBuildingMs?: number;
  firstTokenMs?: number;
  streamingMs?: number;
  total?: number;
}

export class PerformanceTracker {
  private timers = new Map<string, number>();
  private startTime: number;
  private retrievalBreakdown?: RetrievalBreakdown;

  constructor() {
    this.startTime = Date.now();
  }

  startTimer(label: string): void {
    this.timers.set(`${label}_start`, Date.now());
  }

  endTimer(label: string): number {
    const start = this.timers.get(`${label}_start`);
    if (!start) return 0;
    
    const duration = Date.now() - start;
    this.timers.set(label, duration);
    return duration;
  }

  startAttachmentTimer(phase: string, attachmentId: string): void {
    this.timers.set(`${phase}:${attachmentId}_start`, Date.now());
  }

  endAttachmentTimer(phase: string, attachmentId: string): number {
    const start = this.timers.get(`${phase}:${attachmentId}_start`);
    if (!start) return 0;
    
    const duration = Date.now() - start;
    this.timers.set(`${phase}:${attachmentId}`, duration);
    return duration;
  }

  getAttachmentTimings(phase: string): Record<string, number> {
    const timings: Record<string, number> = {};
    const prefix = `${phase}:`;

    for (const [key, duration] of this.timers.entries()) {
      if (key.startsWith(prefix) && !key.endsWith('_start')) {
        const attachmentId = key.substring(prefix.length);
        timings[attachmentId] = duration;
      }
    }

    return timings;
  }

  setRetrievalBreakdown(breakdown: RetrievalBreakdown): void {
    this.retrievalBreakdown = breakdown;
  }

  getFullMetrics(): TimingMetrics {
    return {
      totalRequestMs: Date.now() - this.startTime,
      queryExpansionMs: this.timers.get('queryExpansion'),
      retrievalMs: this.timers.get('retrieval'),
      retrievalBreakdown: this.retrievalBreakdown,
      promptBuildingMs: this.timers.get('promptBuilding'),
      firstTokenMs: this.timers.get('firstToken'),
      streamingMs: this.timers.get('streaming'),
      total: this.timers.get('totalGeneration'),
    };
  }

  getMetrics(): Partial<TimingMetrics> {
    return this.getFullMetrics();
  }

  getDuration(label: string): number | undefined {
    return this.timers.get(label);
  }
}
