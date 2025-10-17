# EchoPlay Mobile App

The EchoPlay mobile client is an Expo + React Native application that delivers the realtime debate experience described in the full build specification. This iteration wires the authenticated navigation flow, debate orchestration screens, LiveKit audio integration helpers, and shared Zustand stores that bridge REST and Socket.IO contracts.

## App Highlights
- **Navigation** – React Navigation stacks/tabs for onboarding (Welcome, Login, ModeSelect) and the core experience (Play/Home, Tournaments, Leaderboard, Profile) with deep links into Lobby and Live Match screens.
- **State Management** – Persisted Zustand stores for auth and match lifecycle coordinating REST mutations, socket events, and LiveKit session metadata.
- **Realtime** – Socket.IO client hook that joins match rooms, mirrors server broadcasts, and fan-outs timer/reaction/vote updates into local state.
- **Voice** – LiveKit helper that connects to the room returned by the backend and publishes local audio tracks while tracking remote participants.
- **UI Components** – Shared design system primitives (buttons, cards, reaction bar, timer bar, AI coach panel) aligned with the production spec’s interaction model.
- **Analytics** – PostHog wrapper with lifecycle hooks to capture auth/match funnel events (stubbed until keys are provided).

## Directory Layout
```
app/
  App.tsx                # Navigation container + auth gate
  components/            # Reusable buttons, cards, reactions, timers, coach panel
  hooks/                 # Auth bootstrap + Socket.IO orchestration
  lib/                   # API, socket, LiveKit, analytics helpers
  screens/               # Onboarding + core tabs (Home, Lobby, LiveMatch, etc.)
  state/                 # Zustand stores for auth + match
  theme/                 # Color/spacing/typography tokens
```

## Next Steps
- Connect real Firebase provider sign-ins instead of anonymous placeholder flows.
- Layer optimistic/offline handling around API mutations and socket retries.
- Flesh out tournament and leaderboard detail views with richer data sets.
- Add automated testing (unit + Detox) once Expo tooling is available in CI.
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
