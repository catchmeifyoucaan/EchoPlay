# EchoPlay Backend

The EchoPlay backend is implemented with NestJS (Node.js 20, TypeScript) and Prisma ORM targeting PostgreSQL. Socket.IO manages realtime debate state, while LiveKit handles voice rooms. Refer to [`../docs/full-build-spec.md`](../docs/full-build-spec.md) for full API contracts and infrastructure requirements.

## Current Status
- Firebase-authenticated NestJS API with JWT session tokens, Prisma persistence, and guards across all protected routes.
- Families, kids, matches, tournaments, leaderboards, moderation, and coaching services wired to the relational data model.
- LiveKit integration helper that provisions rooms and generates access tokens (with graceful stubs when credentials are missing).
- Heuristic moderation and AI scoring pipelines to unblock clients while external providers are wired up.

## Next Steps
- Connect a real PostgreSQL database and run `prisma migrate deploy` to materialise the schema.
- Replace heuristic moderation/coach scoring with production AI providers (Perspective API, LLM scoring) and ASR workers.
- Stand up Socket.IO `/realtime` namespace with Redis adapter and authoritative timers.
- Add BullMQ workers for asynchronous tasks (ASR, AI feedback, leaderboard snapshots).

## Local Development Checklist
- `DATABASE_URL` pointing to local Postgres.
- Firebase service account credentials for token verification.
- LiveKit API key/secret.
- Stripe, Perspective API, storage credentials.
- Doppler or 1Password integration for secret management.
