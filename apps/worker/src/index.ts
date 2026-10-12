import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Queue mẫu; các job thật (fan-out feed, resize ảnh, thông báo) sẽ thêm ở các giai đoạn sau.
export const defaultQueue = new Queue('default', { connection });

new Worker(
  'default',
  async (job) => {
    console.log(`[worker] job ${job.id} (${job.name})`);
  },
  { connection, concurrency: 5 },
);

console.log('[worker] started');
