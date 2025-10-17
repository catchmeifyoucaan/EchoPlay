# EchoPlay

EchoPlay is a realtime debate and coaching platform designed for families, couples, and global communities. This repository tracks the end-to-end production blueprint—including data models, API contracts, mobile and backend architecture, and operational requirements—so engineering teams can spin up the implementation quickly.
EchoPlay is a realtime debate and coaching platform designed for families, couples, and global communities. This repository currently tracks the end-to-end production blueprint—including data models, API contracts, mobile and backend architecture, and operational requirements—so engineering teams can spin up the implementation quickly.

## Repository Layout

```
apps/
  mobile/           # Expo (React Native) application scaffold
  web/              # Optional Next.js spectator & marketing site
backend/            # NestJS service with Prisma + Socket.IO
modules/            # Shared packages (to be defined)
docs/               # Architecture and specification references
infrastructure/     # Terraform/CDK/Helm, etc. (future)
```

The structure mirrors the build specification and is ready for code scaffolding. Each area includes README files that summarize responsibilities and reference the central documentation in `docs/`.

## Getting Started

1. Review [`docs/full-build-spec.md`](docs/full-build-spec.md) for the authoritative product and engineering requirements.
2. Explore the NestJS backend skeleton in [`backend/`](backend/) for placeholder implementations of the documented REST APIs.
3. Flesh out service and client scaffolds under `backend/` and `apps/` following the contracts in the spec.
4. Configure environment variables listed in the documentation before local development.
5. Stand up CI/CD workflows (GitHub Actions, EAS, Vercel) aligned with the production checklist.

## Status

The backend service skeleton is now in place with DTOs and placeholder handlers. All implementation work should reference the included specification to ensure parity with the production MVP goals.
2. Flesh out service and client scaffolds under `backend/` and `apps/` following the contracts in the spec.
3. Configure environment variables listed in the documentation before local development.
4. Stand up CI/CD workflows (GitHub Actions, EAS, Vercel) aligned with the production checklist.

## Status

This repo is in the planning stage. All implementation work should reference the included specification to ensure parity with the production MVP goals.
