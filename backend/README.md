# EchoPlay Backend

The backend service will be implemented with NestJS (Node.js 20, TypeScript) and Prisma ORM targeting PostgreSQL. Socket.IO manages realtime debate state, while LiveKit handles voice rooms. Refer to [`../docs/full-build-spec.md`](../docs/full-build-spec.md) for full API contracts and infrastructure requirements.

## Next Steps
- Initialize NestJS project structure (`src/`, `main.ts`, modules per domain).
- Configure Prisma schema using the models defined in the spec.
- Integrate Firebase Auth verification, JWT issuance, and role-based guards.
- Implement REST endpoints for auth, matchmaking, AI services, and leaderboards.
- Wire Socket.IO namespace `/realtime` with authoritative timers and state transitions.
- Establish LiveKit REST client for room provisioning and token generation.
- Set up BullMQ workers for asynchronous ASR, AI scoring, and leaderboard snapshots.

## Local Development Checklist
- `DATABASE_URL` pointing to local Postgres.
- Firebase service account credentials for token verification.
- LiveKit API key/secret.
- Stripe, Perspective API, storage credentials.
- Doppler or 1Password integration for secret management.
