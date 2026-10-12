export interface HealthStatus {
  status: 'ok' | 'degraded';
  db: boolean;
  redis: boolean;
  uptime: number;
}
