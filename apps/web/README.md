# EchoPlay Web Experience

The optional web app will be built with Next.js 15 and TypeScript. It serves marketing content, community leaderboards, and a spectator mode for live debates.

## Key Decisions
- **Styling**: Tailwind CSS with shadcn/ui components for consistent theming.
- **Data Fetching**: Next.js server components and edge runtime where appropriate for low-latency spectator data.
- **Realtime**: Socket.IO client for spectator rooms; LiveKit viewer mode for listening to ongoing debates.
- **Deployment**: Vercel with preview deployments on pull requests.

## Feature Outline
- Marketing landing pages, feature explainer sections, and CTA for mobile downloads.
- Web-based spectator lobby that consumes `/v1/matches/:id` and listens for `room_state`, `reaction_update`, and `vote_update` socket events.
- Leaderboard pages powered by `/v1/leaderboard` with static generation + revalidation.
- Account management links redirecting to the mobile app for primary gameplay.

Consult [`../../docs/full-build-spec.md`](../../docs/full-build-spec.md) for end-to-end requirements and ensure parity with the mobile client.
