# Observability Plan

Linear issue: AWO-62

Last updated: 2026-05-12

## Purpose

AWO should not rely on Tony noticing broken pages by hand. V0.7 turns the build
from "works in a browser today" into a system with repeatable release evidence,
explicit monitoring decisions, and clear next steps for production confidence.

## Current Evidence

The local release gate is active:

```powershell
npm run test:release
```

It runs:

- lint
- production build
- fresh local production server on port 3100
- route smoke tests
- desktop and mobile visual QA

Latest evidence:

- `.qa/release-readiness/latest.json`
- `.qa/awo-44/desktop-admin-ops.png`
- `.qa/awo-44/mobile-admin-ops.png`

## Current Runtime Signals

Available today:

- GitHub Actions release readiness workflow
- Vercel deployment status
- Stripe sandbox webhook delivery logs
- Supabase order, payment, reveal, and queue state through `/admin/ops`
- Local release readiness JSON and visual screenshots
- Linear gate comments for human-readable evidence

Not yet configured:

- application error tracking
- product analytics
- performance/web vital monitoring
- authenticated end-to-end tests

Current app posture checks:

- `/admin/launch` includes an Observability section that reports whether error
  tracking, analytics, performance monitoring, and uptime monitoring appear to
  be configured.
- `/api/health` includes no-secret boolean observability flags for the same
  posture checks.
- These checks are intentionally configuration-only. They do not choose a paid
  provider or expose DSNs, API keys, or project IDs.

## Recommended Production Stack

Use hosted tools rather than building custom observability first.

- Errors: Sentry
- Product analytics: PostHog or Vercel Web Analytics
- Performance: Vercel Speed Insights
- Uptime: Vercel checks first, external uptime monitor later if needed
- Release evidence: GitHub Actions running `npm run test:release`

## Event Plan

Track only events that answer product or operational questions. Do not spray
analytics on every click.

Core buyer events:

- `shop_viewed`
- `card_viewed`
- `cart_item_added`
- `checkout_started`
- `checkout_paid`
- `reveal_started`
- `reveal_completed`

Core ops events:

- `admin_ops_viewed`
- `stripe_webhook_paid`
- `stripe_webhook_failed`
- `reveal_locked`
- `credential_generation_failed`

## Environment Posture Keys

The current readiness checks recognize these optional keys without exposing
their values:

- Error tracking: `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN`
- Product analytics: `NEXT_PUBLIC_POSTHOG_KEY`,
  `POSTHOG_PROJECT_API_KEY`, or `VERCEL_ANALYTICS_ID`
- Performance monitoring: `NEXT_PUBLIC_VERCEL_SPEED_INSIGHTS_ID` or
  `VERCEL_SPEED_INSIGHTS_ID`
- Uptime monitor reference: `AWO_UPTIME_MONITOR_URL`

## Error Policy

Production error capture should include:

- route
- environment
- release commit SHA
- safe order or checkout reference when available
- no card numbers
- no Stripe secret keys
- no Supabase service-role key
- no buyer access tokens

## Gate Criteria For V0.7

V0.7 can close when:

- `npm run test:release` passes and evidence is attached to Linear.
- The GitHub Actions release-readiness workflow has a passing run.
- The team chooses the observability stack or explicitly defers it.
- The production gap audit no longer lists stale blockers.
- Tony reviews the remaining monitoring tradeoffs.

## Deferred Until Later

- Full synthetic browser monitoring against production.
- Real-time fraud dashboards.
- Custom in-app analytics dashboards.
- Deep revenue reporting.
- Customer support tooling.
