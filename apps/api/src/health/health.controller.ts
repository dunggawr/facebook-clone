import { Controller, Get, Inject } from '@nestjs/common';
import type pg from 'pg';
import type { Redis } from 'ioredis';
import { PG_POOL, REDIS } from '../infra/infra.module.js';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const [db, redis] = await Promise.all([
      this.pool.query('select 1').then(() => true, () => false),
      this.redis.ping().then(() => true, () => false),
    ]);
    return {
      status: db && redis ? 'ok' : 'degraded',
      db,
      redis,
      uptime: Math.round(process.uptime()),
    };
  }
}
