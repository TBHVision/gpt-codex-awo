# Current Context

Last updated: 2026-05-08

## Project

GPT-Codex AWO lives at `C:\HatchVision\AWO\GPT-Codex`.

## Current Phase

V0.1 Security + Data/Auth

Gate state: Open. First deliverable is dashboard admin authentication.

## What Exists

- Next.js app in `apps/web`
- Next.js app mirrored at repository root for Vercel default deployment
- Protected project home route at `/admin/build`
- Distinct visual treatment for state labels vs action buttons
- Dashboard data in `apps/web/src/data/build-dashboard.ts`
- Project docs in `docs/`
- Agent lane folders in `agents/`
- Linear project: `GPT-Codex AWO Build`
- Linear URL: https://linear.app/hatchvision/project/gpt-codex-awo-build-7e22f4e31cd8
- Linear is the source of truth for phases, issues, parking lot items, dependencies, and gate reviews.

## Verification

- `npm.cmd run lint`: passing
- `npm.cmd run build`: passing
- HTTP smoke test for `/admin/build`: passing with status 200
- V0.1 admin auth browser flow: `/admin/build` redirects to login, configured password unlocks dashboard, logout returns to login.
- V0.0 Codex Tests are 5/5 based on lint, build, route generation, dashboard content, and docs present.
- Tony completed V0.0 human tests in the web dashboard.
- In-app browser automation is working against the local production server at `http://127.0.0.1:3000/admin/build`.
- Localhost should be run with `npm.cmd run build` then `npm.cmd run start -- --hostname 0.0.0.0 --port 3000` for reliable button testing.
- If Vercel shows `404: NOT_FOUND`, verify the Vercel root directory is `apps/web`.
- If Vercel says `cd apps/web: No such file or directory`, remove `cd apps/web` from install/build commands because Root Directory is already `apps/web`.
- Current Vercel recommendation is default repo-root deployment. The Next app is mirrored at the root to eliminate Vercel Root Directory confusion.
- Public Vercel dashboard has noindex protections: robots.txt disallows all, metadata robots noindex/nofollow, and X-Robots-Tag headers.
- V0.1 must add an app-level password/auth gate for the dashboard.
- `/` redirects to `/admin/build` so Vercel preview thumbnails and root visits land on the dashboard.
- Dashboard review state is browser-local. Localhost and Vercel may differ until changes are pushed/deployed and local browser state is reset or versioned.
- Decorative gas tank/current gate metric cards were removed because they were not tied to real usage data and duplicated the phase table.
- V0.1 admin password gate protects `/admin/*` except `/admin/login` and `/admin/logout`.
- Vercel must define `AWO_ADMIN_PASSWORD` and `AWO_ADMIN_SESSION_TOKEN` before production dashboard login works.
- The old editable build dashboard is retired to avoid two sources of truth. `/admin/build` is now a lightweight Linear launch page.

## Next Work

- Design initial Supabase schema and migrations
- Add and test RLS policies
- Document auth session model and admin bootstrap path
