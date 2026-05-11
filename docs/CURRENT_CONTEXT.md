# Current Context

Last updated: 2026-05-11

## Project

GPT-Codex AWO lives at `C:\HatchVision\AWO\GPT-Codex`.

## Current Phase

Buyer account auth path.

Active Linear issue: AWO-41.

Goal: replace any-code reveal preview with server-mediated QR/PIN validation against Supabase records.

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
- Supabase CLI is installed as a project dev dependency and runs with `npx supabase`.
- Production `/shop` reads seeded Supabase `published_cards`.
- AWO-18 is done. Vercel public Supabase env vars are healthy in production.
- Production gap audit lives in `docs/PRODUCTION_GAP_AUDIT.md`.
- AWO-37 is complete. Checkout drafts use the narrow
  `create_anonymous_order_draft` Supabase RPC plus `/api/checkout/draft`. It
  saves recipient, occasion, message, cart items, and totals without collecting
  payment.
- AWO-38 adds `/account` for buyer sign-in/sign-up through Supabase Auth.
- New Supabase Auth users get a `public.profiles` row with role `buyer` through
  `create_buyer_profile_for_auth_user`.
- Buyer sessions are temporarily stored in browser localStorage. Server-side
  Supabase session cookies come later when account-owned People, Reminders, and
  order history are wired.
- AWO-39 adds account-aware People and Reminders behavior:
  - signed-in buyers read/write `people` and `occasions` through Supabase RLS
  - guests keep local browser fallback
  - `occasions` are the current reminder records until a narrower reminders
    model is justified
- AWO-40 makes `/admin/ops` dynamic and read-only:
  - public catalog health reads from Supabase with public anon key
  - sensitive order/reveal metrics require `SUPABASE_SERVICE_ROLE_KEY`
  - no destructive admin controls are exposed
- AWO-41 adds the first real reveal verification path:
  - demo code `AWO-DEMO-001` and PIN `1234`
  - `/api/reveal/verify` calls Supabase RPC `verify_honoree_reveal`
  - invalid code/PIN responses return safe messages without card/artist payloads
  - successful reveal returns card, artist, evidence, chain-of-custody, and
    ownership summary

## Next Work

- Use the new Linear runway:
  - AWO-42 persist artist profiles and studio drafts
  - AWO-43 define order/reveal/custody/ownership lifecycle states
  - AWO-44 mobile and visual QA across golden paths
