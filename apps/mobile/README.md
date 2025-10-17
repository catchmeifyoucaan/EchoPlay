# EchoPlay Mobile App

The mobile client will be built with Expo (React Native) and TypeScript. It targets iOS and Android with a mobile-first UX that connects to the EchoPlay realtime debate experience.

## Architecture
- **Navigation**: React Navigation with stack/tab routing for onboarding and core tabs (Play, Tournaments, Leaderboard, Profile).
- **State Management**: Zustand stores for auth (`authStore`) and match lifecycle (`matchStore`).
- **Data Validation**: Zod schemas integrated into API helpers.
- **Realtime**: Socket.IO client for match state, LiveKit SDK for voice rooms.
- **Animations**: Reanimated 3 for interactive UI (timers, reactions).
- **Analytics & Messaging**: PostHog and OneSignal integrated via `lib/analytics.ts` and push notification hooks.

## Directory Skeleton
```
app/
  screens/
  components/
  state/
  lib/
  hooks/
  theme/
```

Each screen and component should align with the flows described in [`../../docs/full-build-spec.md`](../../docs/full-build-spec.md).

## Implementation Notes
- Centralize API requests in `app/lib/api.ts` with JWT handling and retry logic.
- Match store emits socket events for `start_round`, `submit_reaction`, and `submit_vote` per the spec.
- Handle LiveKit token acquisition via `/v1/matches/:id/join`.
- Apply parental controls and COPPA-safe UX for child profiles.
- Instrument exhaustive error and offline handling for mobile networks.
