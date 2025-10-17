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
