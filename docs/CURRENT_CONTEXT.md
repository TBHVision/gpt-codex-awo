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
- If Vercel shows `404: NOT_FOUND`, verify the Vercel root directory is `apps/web`.
- If Vercel says `cd apps/web: No such file or directory`, remove `cd apps/web` from install/build commands because Root Directory is already `apps/web`.
- Current Vercel recommendation is native monorepo setup: Root Directory `apps/web`, Install Command `npm install`, Build Command `npm run build`, Output Directory blank/default.

## Next Work

- Tony reviews the dashboard and checks the human-test boxes
- Submit the V0.0 gate review in the dashboard
- Push local Git repo to HatchVision-owned GitHub repo
- Configure Vercel with Root Directory `apps/web`
- Begin V0.1 planning for HatchVision-owned Supabase tenant
