# Current Context

Last updated: 2026-05-11

## Project

GPT-Codex AWO lives at `C:\HatchVision\AWO\GPT-Codex`.

## Current Phase

V0.2 through V0.7 have implementation evidence, but the phase gates should stay
In Review until Tony completes the human checks listed in Linear.

Active Linear gate issues:

- AWO-57: V0.2 Public Shop gate, Codex evidence attached, waiting on Tony public
  shop and signed-in buyer UX review.
- AWO-58: V0.3 Honoree Reveal gate, Codex evidence attached, waiting on Tony
  mobile recipient review.
- AWO-59: V0.4 My People + Buyer Tools gate, Codex evidence attached, waiting on
  Tony warmth/usefulness review.
- AWO-60: V0.5 Artist Studio gate, Codex evidence attached, waiting on Tony
  artist confidence/submission clarity review.
- AWO-61: V0.6 Admin + Ops gate, waiting on Tony review of `/admin/ops`.
- AWO-62: V0.7 QA + Observability gate, Codex evidence attached, waiting on
  Tony observability/CI deferral decisions.

Goal: keep moving autonomously through Linear by attaching concrete release
evidence to gate issues, then batching Tony review asks instead of stopping for
every small decision.

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
- AWO-42 adds the first artist studio persistence path:
  - public `/artists` reads approved artist profiles from Supabase
  - signed-in artist/admin accounts read and write draft cards through Supabase RLS
  - provenance checklist state is stored on draft `cards`
  - guests keep a local browser fallback for studio exploration
- AWO-43 lifecycle model lives in `docs/LIFECYCLE_MODEL.md`:
  - order status should not be overloaded for payment, fulfillment, reveal,
    custody, and ownership
  - production follow-ups need item-level state, reveal credential states,
    custody events, and ownership records
- AWO-45 adds lifecycle schema foundations:
  - `payment_lifecycle_status`, `fulfillment_lifecycle_status`,
    `order_item_status`, `reveal_credential_status`, `custody_event_type`, and
    `ownership_status`
  - `orders` gets payment/fulfillment fields
  - `order_items` gets item-level status
  - `honoree_reveals` gets credential status and revocation/expiration fields
  - `custody_events` and `ownership_records` are added with RLS
- AWO-47 hardens `verify_honoree_reveal`:
  - locked, expired, revoked, generation-failed, and pending-generation
    credentials return safe failure messages without card/artist payloads
  - invalid PIN attempts lock the credential at the configured threshold
  - successful reveals emit `recipient_revealed` custody events
- AWO-48 extends `/admin/ops` with lifecycle queues:
  - order, payment, item, and reveal credential state counts
  - stuck queues for stale draft orders, failed payments, credential generation
    failures, and locked reveals
  - recent orders include order, payment, and fulfillment states
  - the page remains read-only and depends on server-only service-role access for
    sensitive operational metrics
- AWO-44 adds a repeatable visual QA harness:
  - `npm.cmd run test:visual` launches local Chrome through the debugging
    protocol and inspects desktop and mobile routes
  - screenshots are written to `.qa/awo-44/` and ignored by git
  - the current sweep covers home, shop, card detail, cart, checkout, reveal,
    people, reminders, studio, account, artists, admin build, and admin ops
  - mobile hero typography was tightened after screenshot review
  - larger visual follow-ups are AWO-49 mobile navigation and AWO-50 production
    card artwork assets
- AWO-49 compacts storefront navigation on mobile:
  - mobile shows account, cart, and menu controls in the top row
  - section links collapse behind a menu with an active-section label
  - desktop navigation stays centered and visible
  - visual QA now also verifies the mobile menu opens and exposes section links
- AWO-50 adds managed demo card artwork assets:
  - static artwork lives under `public/cards/` and is mirrored to
    `apps/web/public/cards/`
  - Supabase demo catalog rows now point at `/cards/birthday-light.svg`,
    `/cards/keep-going.svg`, and `/cards/with-you.svg`
  - `cover_media_url` remains optional, so the shop and card detail fallback art
    still protects missing-image cases
- AWO-51 adds the storefront polish pass:
  - the real AWO logo lives at `/awo-logo.png` and is mirrored to both public
    roots
  - the demo catalog is aligned to the five-card pre-visualization:
    Wildflower Notes, Coastal Morning, With All My Heart, Morning Song, and
    Misty Pines
  - matching public card artwork lives under `/cards/*.svg`
- AWO-46 is complete:
  - `/api/checkout/session` creates a Supabase draft order, then a Stripe
    test-mode Checkout Session from trusted database prices
  - `/api/stripe/webhook` handles Stripe test webhook events and updates order
    payment lifecycle state server-side
  - the app rejects live Stripe secret keys while AWO is in test-mode wiring
  - env and webhook setup are documented in `docs/STRIPE_TEST_MODE.md`
  - Stripe test payment moved `AWO-DRAFT-F2EC02824E` to `status = paid` and
    `payment_status = paid`
  - checkout return URLs now show success/cancel messaging
- AWO-52 tightens mobile storefront density:
  - mobile shop hero uses a smaller brand logo than desktop
  - trust cues move to a compact two-column mobile grid
  - category tabs become easier to scan before the first product card
- AWO-53 adds server-mediated buyer order ownership:
  - checkout draft/session requests can include the buyer Supabase access token
  - `/api/buyer/session` verifies buyer sessions server-side
  - the server verifies buyer tokens before attaching `orders.buyer_profile_id`
  - `/account` shows buyer-owned order history through RLS
- AWO-54 adds signed-in buyer cart persistence:
  - guests continue using browser-local cart storage
  - signed-in buyers sync cart contents to Supabase `carts` and `cart_items`
    through RLS
  - cart and checkout pages merge local and account cart state without doubling
    quantities on reload
  - clearing cart also clears the signed-in buyer cart when possible
- AWO-55 adds one-command release readiness:
  - `npm.cmd run test:release` runs lint, build, starts a fresh local production
    server on port 3100, then runs smoke and visual QA
  - report output is written to `.qa/release-readiness/latest.json`
- AWO-61 gate evidence is attached in Linear:
  - `npm run test:release` passed at 2026-05-11T17:11Z
  - `/admin/ops` visual QA passed on desktop and mobile
  - service-role data shows paid orders, payment states, reveal rows, and locked
    reveal queues
- AWO-62 adds `docs/OBSERVABILITY_PLAN.md` for error, analytics, performance,
  uptime, and release evidence posture
- AWO-62 also adds `.github/workflows/ci.yml` so GitHub Actions runs
  `npm run test:release` on pushes to `main` and pull requests
- `docs/GATE_EVIDENCE.md` records current gate evidence for V0.2 through V0.7.
- `/admin/launch` is the protected V1.0 launch-readiness surface:
  - it checks required server/browser environment variables without displaying
    secret values
  - it reads the latest local release-readiness JSON report
  - it confirms critical docs exist
  - it keeps Tony review and live-payment approval as explicit human gates
  - it is covered by smoke and visual QA
- `/admin/reviews` is the protected read-only launch review queue:
  - card and artist status counts plus recent rows
  - recent order state, payment state, and fulfillment state
  - reveal credential status and failed-attempt visibility
  - intentionally no approve/refund/destructive controls until admin auth roles
    and audit flows are built
- Admin login now has a production-path option:
  - Supabase Auth email/password can unlock admin routes only when the user's
    `profiles.role` is `admin`
  - the existing `AWO_ADMIN_PASSWORD` fallback still works while named admin
    users are being phased in
  - Supabase access tokens are not stored after the login verification step
- AWO-66 adds the first audited admin write path:
  - `/admin/reviews` can approve or reject `pending_review` cards
  - actions require Supabase-backed named admin login, not temporary password
  - the server re-checks `profiles.role = admin` before writing
  - each action writes an `admin_audit_events` row
- `docs/TONY_REVIEW_BATCH.md` is the current batched list of Tony reviews,
  external checks, and later decisions.

## Next Work

- Use the new Linear runway:
  - have Tony review AWO-57 through AWO-60 when convenient
  - have Tony review AWO-61 `/admin/ops` when convenient
  - check the first GitHub Actions release-readiness run after push
  - finish AWO-62 by deciding the observability stack or explicitly deferring it
  - use `/admin/launch` plus AWO-63 for the final V1.0 gate review
  - use AWO-64 and `/admin/reviews` to evaluate what production approval queues
    need before write-capable admin tools
  - Real card photography/art direction can replace the managed demo assets when
    Tony provides final production artwork
