
interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
}

type JobHandler<T = any> = (data: T) => Promise<void>;

class Queue {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing: boolean = false;

  registerHandler<T = any>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler);
    console.log(`[Queue] Registered handler for: ${type}`);
  }

  async add<T>(type: string, data: T, options?: { maxAttempts?: number }): Promise<string> {
    const jobId = `${type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const job: Job<T> = {
      id: jobId,
      type,
      data,
      status: 'pending',
      attempts: 0,
      maxAttempts: options?.maxAttempts || 3,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);
    console.log(`[Queue] Job added: ${jobId} (${type})`);

    if (!this.processing) {
      this.processNext();
    }

    return jobId;
  }


  private async processNext(): Promise<void> {
    this.processing = true;

    // find next pending job
    const pendingJob = Array.from(this.jobs.values()).find(
      (job) => job.status === 'pending'
    );

    if (!pendingJob) {
      this.processing = false;
      return;
    }

    const handler = this.handlers.get(pendingJob.type);
    if (!handler) {
      console.error(`[Queue] No handler registered for: ${pendingJob.type}`);
      pendingJob.status = 'failed';
      pendingJob.error = 'No handler registered';
      this.processNext(); // Continue to next job
      return;
    }

    // Mark as processing
    pendingJob.status = 'processing';
    pendingJob.attempts++;
    console.log(`[Queue] Processing job: ${pendingJob.id} (attempt ${pendingJob.attempts})`);

    try {
      await handler(pendingJob.data);
      pendingJob.status = 'completed';
      pendingJob.processedAt = new Date();
      console.log(`[Queue] Job completed: ${pendingJob.id}`);
    } catch (error) {
      console.error(`[Queue] Job failed: ${pendingJob.id}`, error);
      pendingJob.error = error instanceof Error ? error.message : 'Unknown error';

      // Retry if attempts remaining
      if (pendingJob.attempts < pendingJob.maxAttempts) {
        pendingJob.status = 'pending';
        console.log(`[Queue] Job will retry: ${pendingJob.id}`);
      } else {
        pendingJob.status = 'failed';
        console.log(`[Queue] Job failed permanently: ${pendingJob.id}`);
      }
    }

    // Process next job
    setImmediate(() => this.processNext());
  }


  getJobStatus(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  cleanup(olderThanMs: number = 3600000): void {
    const cutoff = Date.now() - olderThanMs;
    let cleaned = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.createdAt.getTime() < cutoff
      ) {
        this.jobs.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Queue] Cleaned up ${cleaned} old jobs`);
    }
  }
}

export const jobQueue = new Queue();

// Cleanup old jobs every hour
setInterval(() => {
  jobQueue.cleanup();
}, 3600000);
