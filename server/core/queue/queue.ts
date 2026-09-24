import { Job, JobType, JobPayloadMap } from './job-types';
import { logger } from '../logger/logger';

export type JobHandler<T extends JobType> = (payload: JobPayloadMap[T]) => Promise<void>;

export class JobQueue {
  private queue: Job<any>[] = [];
  private handlers = new Map<JobType, JobHandler<any>>();
  private concurrency = 3;
  private activeWorkers = 0;
  private maxRetries = 3;
  private completedCount = 0;
  private failedCount = 0;
  private autoProcess = true;

  constructor(autoProcess: boolean = true) {
    this.autoProcess = autoProcess;
  }

  registerHandler<T extends JobType>(type: T, handler: JobHandler<T>) {
    this.handlers.set(type, handler);
    logger.info(`Job handler registered for type: ${type}`);
  }

  async add<T extends JobType>(
    type: T,
    payload: JobPayloadMap[T],
    options: { priority?: number; maxRetries?: number; backoffDelayMs?: number } = {}
  ): Promise<string> {
    const job: Job<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      attempts: 0,
      maxRetries: options.maxRetries ?? this.maxRetries,
      priority: options.priority ?? 0,
      status: 'pending',
      createdAt: Date.now(),
    };

    // Insert sorted by priority (descending)
    const insertIdx = this.queue.findIndex((item) => item.priority < job.priority);
    if (insertIdx === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIdx, 0, job);
    }

    logger.debug(`Enqueued background job: ${job.type} (${job.id})`);
    if (this.autoProcess) {
      this.processNext();
    }
    return job.id;
  }

  async processNext() {
    if (this.activeWorkers >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      logger.error(`No worker handler registered for job type: ${job.type}`);
      job.status = 'failed';
      job.error = 'No handler registered';
      this.failedCount++;
      return;
    }

    this.activeWorkers++;
    job.status = 'processing';
    job.attempts++;
    job.processedAt = Date.now();

    try {
      logger.debug(`Processing job ${job.type} (${job.id}), attempt ${job.attempts}`);
      await handler(job.payload);
      job.status = 'completed';
      job.completedAt = Date.now();
      this.completedCount++;
      logger.debug(`Successfully completed job ${job.type} (${job.id})`);
    } catch (err: any) {
      logger.error(`Error executing job ${job.type} (${job.id}): ${err?.message || err}`);
      if (job.attempts < job.maxRetries) {
        // Re-queue with exponential backoff delay
        const backoffMs = Math.pow(2, job.attempts) * 10;
        setTimeout(() => {
          job.status = 'pending';
          this.queue.push(job);
          if (this.autoProcess) {
            this.processNext();
          }
        }, backoffMs);
      } else {
        job.status = 'failed';
        job.error = err?.message || 'Execution error';
        this.failedCount++;
        logger.error(`Job ${job.type} (${job.id}) permanently failed after ${job.attempts} attempts`);
      }
    } finally {
      this.activeWorkers--;
      if (this.autoProcess) {
        this.processNext();
      }
    }
  }

  getStats() {
    return {
      pending: this.queue.filter((j) => j.status === 'pending').length,
      activeWorkers: this.activeWorkers,
      concurrency: this.concurrency,
      totalRegisteredHandlers: this.handlers.size,
      completed: this.completedCount,
      failed: this.failedCount,
    };
  }
}

export const jobQueue = new JobQueue();
