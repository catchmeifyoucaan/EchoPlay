# EchoPlay Shared Modules

This workspace will eventually contain shared packages (TypeScript) consumed by the mobile app, web app, and backend services. Example modules include:

- **`@echoplay/types`**: Zod schemas and TypeScript types for API contracts and socket events.
- **`@echoplay/config`**: Environment configuration helpers shared across projects.
- **`@echoplay/analytics`**: Common analytics wrappers for PostHog/Amplitude.
- **`@echoplay/utils`**: Cross-platform utilities (date/time, formatting, feature flags).

The shared packages should be versioned and published via a monorepo toolchain (e.g., pnpm workspaces or Turborepo) once implementation begins. See [`../docs/full-build-spec.md`](../docs/full-build-spec.md) for contract definitions that these modules must encode.
