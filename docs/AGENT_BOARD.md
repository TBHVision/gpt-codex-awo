# Agent Board

| Agent | Status | Depends On | Owns | Needs Tony |
| --- | --- | --- | --- | --- |
| Orchestrator | Active | None | Planning, sequencing, gates, integration | No |
| Foundation | Active | None | App scaffold, shared structure, build dashboard | No |
| Backend | Queued | Foundation | Supabase schema, RLS, API/server actions | Not yet |
| Shop + Buyer | Queued | Foundation, Backend | Shop, cart, checkout, My People | Not yet |
| Honoree | Queued | Foundation, Backend | QR/PIN reveal, provenance experience | Not yet |
| Artist Studio | Queued | Foundation, Backend | Artist dashboard, submissions, earnings | Not yet |
| Admin + Ops | Queued | Foundation, Backend | User/card/order ops, approvals, fraud | Not yet |
| QA + Hardening | Queued | Feature lanes | Playwright, accessibility, test evidence | Not yet |
| Production Ops | Queued | Stable build | Vercel, Sentry, PostHog, CI, Snyk | Yes later |

