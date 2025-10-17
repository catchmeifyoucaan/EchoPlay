# EchoPlay Infrastructure

This directory will hold infrastructure-as-code assets for provisioning EchoPlay environments (staging, production, sandboxes).

## Targets
- **Networking**: VPC, subnets, security groups/firewalls for backend services.
- **Compute**: Fly.io apps or AWS/GCP equivalents for the NestJS backend and BullMQ workers.
- **Database**: Managed PostgreSQL (Neon or RDS) with automated backups and PITR.
- **Realtime**: LiveKit Cloud configuration plus optional self-hosted helm charts.
- **Storage/CDN**: Cloudflare R2 or AWS S3 with CDN distribution.
- **Secrets Management**: Doppler or 1Password Secrets Automation integration.
- **CI/CD**: GitHub Actions workflows deploying to EAS, Vercel, and cloud targets.
- **Observability**: OpenTelemetry collectors, Honeycomb/DataDog dashboards, uptime and alerting policies.

Refer to [`../docs/full-build-spec.md`](../docs/full-build-spec.md) for operational checklists and environment variables.
