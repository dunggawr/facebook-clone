import { Global, Module, type OnApplicationShutdown, Inject } from '@nestjs/common';
import pg from 'pg';
import { Redis } from 'ioredis';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema.js';

export const PG_POOL = 'PG_POOL';
export const REDIS = 'REDIS';
export const DB = 'DB';
export type Database = NodePgDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      // Pool nhỏ để bảo vệ Postgres trên máy 4GB.
      useFactory: () =>
        new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 15 }),
    },
    {
      provide: DB,
      inject: [PG_POOL],
      useFactory: (pool: pg.Pool): Database => drizzle(pool, { schema }),
    },
    {
      provide: REDIS,
      useFactory: () => {
        const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
          enableOfflineQueue: false,
        });
        redis.on('error', () => {});
        return redis;
      },
    },
  ],
  exports: [PG_POOL, REDIS, DB],
})
export class InfraModule implements OnApplicationShutdown {
  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async onApplicationShutdown() {
    await Promise.allSettled([this.pool.end(), this.redis.quit()]);
  }
}
