# EchoPlay Production Build Specification

This document captures the end-to-end build plan for EchoPlay, translating the high-level product requirements into concrete implementation guidance across client, backend, realtime, AI, and operations domains. It is intended to serve as the single source of truth for engineering, product, and QA teams to coordinate the MVP delivery.

## 0. Technology Stack Overview

### Client Applications
- **Mobile**: React Native (Expo) with TypeScript, React Navigation, Zustand for state management, Reanimated 3 for animations, and Zod for runtime validation.
- **Web (Optional)**: Next.js 15 with TypeScript, Tailwind CSS, and shadcn/ui for the marketing site and spectator experience.

### Realtime Audio/Video
- LiveKit Cloud powers voice rooms and data channels. A self-hosted LiveKit deployment may be adopted later without changing the API surface.

### Backend & Infrastructure
- **Backend Framework**: NestJS on Node.js 20 with TypeScript.
- **Database**: PostgreSQL (Neon or AWS RDS) accessed through Prisma ORM.
- **Realtime State**: Socket.IO (namespaces & rooms) provides authoritative match state updates.
- **Authentication**: Firebase Auth for identity providers (email, Apple, Google). Backend issues scoped JWTs after verification. Child accounts are linked to parent accounts.
- **Storage/CDN**: Cloudflare R2 or Amazon S3 with CloudFront/Cloudflare CDN. Clients upload via pre-signed URLs.
- **Payments**: Stripe for subscriptions, RevenueCat to bridge mobile in-app purchases.
- **AI Services**: Provider-agnostic LLMs for coaching and civility scoring, Google Perspective API plus a custom moderation layer for safety, and a future claim-check feature using search + RAG.
- **Analytics & Messaging**: PostHog (analytics & feature flags), Amplitude (funnels), OneSignal (push notifications).
- **CI/CD**: GitHub Actions pipelines that fan out to EAS (mobile), Vercel (web), and Fly.io/AWS/GCP (backend).
- **Secrets**: Managed via Doppler or 1Password Secrets Automation.

## 1. Data Model (Prisma)

```prisma
model User {
  id            String  @id @default(cuid())
  authProvider  String
  email         String? @unique
  phone         String?
  displayName   String
  avatarUrl     String?
  dob           DateTime?
  role          Role     @default(USER)
  parentId      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  profiles      Profile[]
  families      FamilyMember[]
  devices       Device[]
  subscriptions Subscription[]
}

model Profile {
  id           String  @id @default(cuid())
  userId       String
  mode         Mode
  bio          String?
  interests    String[]
  locale       String   @default("en")
  civilityElo  Int      @default(1000)
  debateElo    Int      @default(1000)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id])
}

model Family {
  id        String  @id @default(cuid())
  name      String
  ownerId   String
  createdAt DateTime @default(now())

  members   FamilyMember[]
}

model FamilyMember {
  id        String  @id @default(cuid())
  familyId  String
  userId    String
  role      String
  createdAt DateTime @default(now())

  family    Family   @relation(fields: [familyId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}

model DebateMatch {
  id           String   @id @default(cuid())
  mode         Mode
  topic        String
  status       MatchStatus
  roomId       String
  hostUserId   String
  startedAt    DateTime?
  endedAt      DateTime?
  aiScore      Int?
  winnerUserId String?
  createdAt    DateTime @default(now())

  rounds       DebateRound[]
  reactions    Reaction[]
  votes        Vote[]
  participants MatchParticipant[]
}

model MatchParticipant {
  id        String  @id @default(cuid())
  matchId   String
  userId    String
  side      String?
  joinedAt  DateTime @default(now())
}

model DebateRound {
  id        String  @id @default(cuid())
  matchId   String
  number    Int
  speakerId String
  startedAt DateTime
  endedAt   DateTime?
  transcript Json?
}

model Reaction {
  id        String  @id @default(cuid())
  matchId   String
  userId    String?
  type      ReactionType
  createdAt DateTime @default(now())
}

model Vote {
  id        String  @id @default(cuid())
  matchId   String
  voterId   String?
  forUserId String
  createdAt DateTime @default(now())
}

model LeaderboardSnapshot {
  id        String  @id @default(cuid())
  scope     String
  period    String
  payload   Json
  createdAt DateTime @default(now())
}

enum Role { USER MOD ADMIN }
enum Mode { SOLO FAMILY COUPLE GLOBAL }
enum ReactionType { HEART THUMBS LAUGH FLAME }
enum MatchStatus { LOBBY LIVE SCORED ENDED }
```

## 2. Backend APIs & Socket Contracts

### REST Endpoints

The NestJS backend exposes RESTful endpoints for authentication, user management, matchmaking, AI services, and leaderboard management. Each endpoint enforces JWT-based auth and scopes.

| Method & Path | Description |
| --- | --- |
| `POST /v1/auth/verify` | Accepts Firebase ID token, returns scoped server JWT. |
| `GET /v1/me` | Returns current user profile. |
| `PATCH /v1/me` | Updates profile fields (display name, avatar, interests, mode). |
| `POST /v1/families` | Creates a new family. |
| `POST /v1/families/:id/invite` | Generates an invite link. |
| `POST /v1/kids` | Creates a child account linked to the parent. |
| `POST /v1/matches` | Creates a match lobby, LiveKit room, and returns host token. |
| `POST /v1/matches/:id/join` | Returns LiveKit token and socket join info. |
| `POST /v1/matches/:id/start` | Marks match live, creates round 1. |
| `POST /v1/matches/:id/score` | Computes AI score and winner. |
| `GET /v1/matches/:id` | Retrieves match details. |
| `POST /v1/coach/feedback` | Returns coaching feedback & civility meter. |
| `POST /v1/moderate/text` | Returns moderation labels and decision. |
| `POST /v1/transcribe` | Converts audio to text via ASR. |
| `GET /v1/leaderboard` | Fetches leaderboard snapshots. |
| `POST /v1/tournaments` | Admin endpoint to define tournaments. |
| `GET /v1/tournaments/:id` | Returns tournament details. |
| `GET /v1/matches/:id/reactions` | Historical reactions. |
| `GET /v1/matches/:id/votes` | Historical votes. |

### Socket.IO Namespace `/realtime`

Rooms follow the pattern `match:{matchId}`. Events include:

#### Client → Server
- `join_room { matchId, jwt }`
- `start_debate { matchId }`
- `start_round { matchId, speakerUserId, durationSec }`
- `submit_reaction { matchId, type }`
- `submit_vote { matchId, forUserId }`
- `end_round { matchId }`
- `request_ai_score { matchId }`

#### Server → Client
- `room_state { match, participants, round, timer }`
- `round_started { number, speakerUserId, endsAt }`
- `timer_tick { remaining }`
- `reaction_update { counts }`
- `vote_update { totals }`
- `ai_score { score, winnerUserId, feedbackSummary }`
- `round_ended { number }`
- `match_ended { aiScore, winnerUserId }`

The backend maintains an authoritative timer emitting `timer_tick` every second.

## 3. LiveKit Integration

- `POST /v1/matches` provisions a LiveKit room and stores its ID.
- `POST /v1/matches/:id/join` generates a LiveKit token for the user.
- Audio sessions remain synchronized via Socket.IO for state transitions. LiveKit data channels optionally broadcast civility meter updates.

## 4. AI & Moderation Flow

1. Text content (nicknames, topics, chat) is moderated via `/v1/moderate/text` before persistence.
2. During rounds, optional on-device profanity filtering is applied.
3. After each round, audio is uploaded for ASR (`/v1/transcribe`), then `/v1/coach/feedback` returns structured feedback.
4. AI scoring aggregates transcripts, speaking time, interruptions, and votes. Results drive match winner selection and updates broadcast via sockets.

## 5. Mobile Application UX

### Onboarding & Auth
- Welcome → Login (Apple/Google/Email) → Mode selection → Avatar & interests → Child account prompt → Home.

### Home Tabs
- **Play**: Quick start cards (Couple Duel, Family Night, Global Challenge).
- **Tournaments**: Lists events from `/v1/tournaments`.
- **Leaderboard**: Weekly and all-time leaderboards from `/v1/leaderboard`.
- **Profile**: Editable profile with parental controls.

### Lobby & Live Match
- Topic picker, LiveKit room join, match start controls.
- Live match UI covers mic toggle, rounds, reactions, votes, AI score, and rematch flow.
- Family mode supports teams with round rotation.

Centralized state lives in a MatchStore (Zustand/Redux) managing match data, participants, reactions, votes, and timers. Actions emit socket events.

## 6. Folder Structure

```text
apps/
  mobile/
    app/
      screens/
      components/
      state/
      lib/
      hooks/
      theme/
  web/
backend/
  prisma/
  src/
docs/
```

## 7. Production Checklist

- Parental consent enforcement, JWT middleware, rate limiting, secure media uploads, analytics anonymization for children.
- Redis-backed Socket.IO adapter for horizontal scaling, idempotent POSTs, BullMQ for asynchronous jobs.
- CI/CD with linting, typing, unit/e2e tests, and Prisma migrations.
- Observability with logs, metrics, and alerts for critical flows.

## 8. QA Test Plan

Covers authentication flows, onboarding persistence, match creation, lobby and live match interactions, reactions & votes, AI scoring, leaderboards, push notifications, and rematch scenarios.

## 9. Environment Variables

Defines example variables for backend and mobile apps (database, JWT, Firebase, LiveKit, Stripe, Perspective API, storage, analytics).

## 10. Backend Handler Examples

Includes NestJS sample handlers for match creation and scoring with LiveKit integration and socket broadcasts.

## 11. Launch & Growth Hooks

Shareable clip export, universal deep links, and themed prompt schedules with feature flags.

## 12. MVP Success Criteria

- 95%+ success rate from join to match start.
- <3s from start to audio readiness.
- AI feedback turnaround <6s.
- COPPA/GDPR compliance, crash-free >99.7%, app store approvals.

---

**Implementation Principle**: Keep the server authoritative for timers, votes, and state transitions, add exhaustive error handling and retries on mobile, and gate new features behind flags with comprehensive logging.
