import { describe, it, expect, vi } from 'vitest';
import { JobQueue } from '../../server/core/queue/queue';
import { JobType } from '../../server/core/queue/job-types';

describe('JobQueue & Background Jobs (Unit Tests)', () => {
  it('should successfully register a worker and process an enqueued job', async () => {
    const queue = new JobQueue(false);
    const mockWorker = vi.fn().mockResolvedValue(undefined);

    queue.registerHandler(JobType.RECORD_METRIC, mockWorker);

    const jobId = await queue.add(JobType.RECORD_METRIC, {
      event: 'user_like',
      metadata: { postId: 'p_101' },
    });

    expect(jobId).toBeDefined();

    // Process jobs immediately
    await queue.processNext();

    expect(mockWorker).toHaveBeenCalledTimes(1);
    expect(mockWorker).toHaveBeenCalledWith({
      event: 'user_like',
      metadata: { postId: 'p_101' },
    });

    const stats = queue.getStats();
    expect(stats.completed).toBe(1);
    expect(stats.failed).toBe(0);
  });

  it('should retry a failed job according to maxRetries before marking failed', async () => {
    const queue = new JobQueue(false);
    const mockFailingWorker = vi.fn().mockRejectedValue(new Error('Simulated network timeout'));

    queue.registerHandler(JobType.DISPATCH_NOTIFICATION, mockFailingWorker);

    await queue.add(
      JobType.DISPATCH_NOTIFICATION,
      { recipientId: 'user_1', senderId: 'user_sender', type: 'like', text: 'liked' },
      { maxRetries: 2, backoffDelayMs: 1 }
    );

    // Process attempt 1 (fails -> retried with backoff)
    await queue.processNext();
    // Wait for backoff timeout to execute
    await new Promise((resolve) => setTimeout(resolve, 80));
    await queue.processNext();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await queue.processNext();

    const stats = queue.getStats();
    expect(stats.failed).toBe(1);
    expect(mockFailingWorker).toHaveBeenCalled();
  });
});
