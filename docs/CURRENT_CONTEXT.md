# Current Context

Last updated: 2026-05-08

## Project

GPT-Codex AWO lives at `C:\HatchVision\AWO\GPT-Codex`.

## Current Phase

V0.0 Foundation + Build Dashboard

Gate state: Ready for self-test and human-test review. Not closed yet.

## What Exists

- Next.js app in `apps/web`
- Build dashboard route at `/admin/build`
- Interactive V0.0 self-test and human-test checklists
- Distinct visual treatment for state labels vs action buttons
- Dashboard data in `apps/web/src/data/build-dashboard.ts`
- Project docs in `docs/`
- Agent lane folders in `agents/`

## Verification

- `npm.cmd run lint`: passing
- `npm.cmd run build`: passing
- HTTP smoke test for `/admin/build`: passing with status 200
- In-app browser automation: blocked by local Windows profile permission issue under `AppData`, not by app code
- Localhost is not reliable enough for Tony review; Vercel preview deployment is now the recommended review surface.

## Next Work

- Tony reviews the dashboard and checks the human-test boxes
- Submit the V0.0 gate review in the dashboard
- Push local Git repo to HatchVision-owned GitHub repo
- Import GitHub repo into Vercel with root directory `apps/web`
- Begin V0.1 planning for HatchVision-owned Supabase tenant
