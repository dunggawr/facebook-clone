# facebook-clone

Mạng xã hội kiểu Facebook: web (Next.js/Vercel) → mobile (Expo). Backend NestJS (Fastify) chạy trên server nhỏ 4GB RAM.

Cấu trúc monorepo pnpm: `apps/web`, `apps/api`, `apps/worker`, `packages/shared`.

## Chạy local
```bash
cp .env.example .env     # đặt JWT_SECRET, GOOGLE_CLIENT_ID (tuỳ chọn)
pnpm install
pnpm infra:up
pnpm --filter api db:migrate
pnpm dev:api & pnpm dev:web
```
