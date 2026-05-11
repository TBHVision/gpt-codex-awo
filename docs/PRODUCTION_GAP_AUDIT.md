# Production Gap Audit

Linear issue: AWO-36, refreshed by AWO-56

Last updated: 2026-05-11

## Executive Summary

The AWO build is no longer just a shell. The public storefront reads the
Supabase catalog, checkout creates durable draft orders, buyer accounts exist,
people/reminders persist for signed-in buyers, signed-in carts sync to Supabase,
order history is account-owned, reveal validation is server-mediated, artist
drafts persist for signed-in creators, and admin ops shows read-only lifecycle
queues.

The primary blocker before a real payment review is Stripe test configuration.
AWO-46 already has server-side Stripe test Checkout Session and webhook code;
Tony still needs to provide/verify the Stripe test secrets and webhook endpoint
in Vercel.

## Verified Surfaces

Current local golden routes:

- `/`
- `/shop`
- `/shop/wildflower-notes`
- `/cart`
- `/checkout`
- `/reveal`
- `/artists`
- `/people`
- `/reminders`
- `/studio`
- `/account`
- `/admin/build`
- `/admin/ops`

Current automated evidence:

- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test:smoke`
- `npm.cmd run test:visual`
- `npm.cmd run test:release`

`test:release` now runs lint, build, a fresh production server, route smoke, and
desktop/mobile visual QA, then writes `.qa/release-readiness/latest.json`.

## Current Health

- Local route smoke tests pass.
- Desktop/mobile visual QA passes across golden routes.
- Public Vercel environment has Supabase catalog variables configured.
- Admin routes redirect unauthenticated users to login.
- Temporary admin password gate remains in place for `/admin/*`.
- Linear is the project source of truth.
- Root app and `apps/web` mirror are kept in sync for Vercel deployment safety.

## Buyer Status

Completed:

- AWO-37: Checkout draft creation writes durable Supabase orders through the
  narrow `create_anonymous_order_draft` RPC and `/api/checkout/draft`.
- AWO-38: Buyer sign-in/sign-up uses Supabase Auth and profile bootstrap.
- AWO-39: Signed-in buyers persist People and Reminders through RLS; guests keep
  local fallback.
- AWO-53: Signed-in checkout can attach orders to buyer profiles, and `/account`
  shows buyer-owned order history through RLS.
- AWO-54: Signed-in carts sync to Supabase `carts` and `cart_items`; guests keep
  browser-local cart fallback.

Remaining:

- Stripe test payment verification is open in AWO-46.
- Server-side Supabase auth cookies are still future work; the current buyer
  session is stored in browser localStorage.
- Existing anonymous draft orders and carts are not retroactively attached unless
  the buyer revisits cart/checkout while signed in.

## Recipient Reveal Status

Completed:

- AWO-41: QR/PIN reveal validation goes through `/api/reveal/verify` and the
  `verify_honoree_reveal` RPC.
- AWO-47: Reveal credential states are hardened for locked, expired, revoked,
  generation-failed, pending-generation, and invalid PIN cases.
- Successful reveals emit or prepare custody-event records.

Remaining:

- Production card-specific QR/PIN generation is not fully automated yet.
- Final recipient copy/art direction still needs human review when real product
  cards exist.

## Artist Status

Completed:

- AWO-42: Public artists read approved Supabase artist profiles.
- Signed-in artist/admin paths can persist studio draft cards and provenance
  checklist state through RLS.

Remaining:

- Full approval workflow and artist onboarding UX are not production-complete.
- Real artist verification and payout/commercial workflows are future scope.

## Admin And Ops Status

Completed:

- AWO-40: `/admin/ops` reads real Supabase operational data.
- AWO-48: Admin ops shows lifecycle queues, stale drafts, failed payments,
  credential generation failures, locked reveals, and recent order states.
- Admin ops remains read-only; no destructive controls are exposed.

Remaining:

- Temporary admin password gate should eventually become Supabase Auth admin
  sessions with per-user role checks and audit trail.
- Real approval tools for users, artists, cards, fraud review, and fulfillment
  still need to be built.

## Data And Lifecycle Status

Completed:

- AWO-43: Lifecycle model documented.
- AWO-45: Lifecycle schema foundations added for payments, fulfillment, item
  status, reveal credential status, custody events, and ownership records.
- AWO-46 partial: Stripe test-mode session and webhook code exists.

Remaining:

- Stripe test env/webhook verification.
- Fulfillment automation and ownership transfer workflows.
- Production reporting/analytics beyond the current read-only ops snapshot.

## QA And Release Status

Completed:

- AWO-44: Desktop/mobile visual QA harness.
- AWO-49: Mobile nav compactness.
- AWO-52: Mobile storefront density polish.
- AWO-55: One-command release readiness gate.

Remaining:

- CI-hosted release gate is still future work.
- Browser-based authenticated end-to-end tests are still parked until account
  flows stabilize further.
- Production smoke/visual checks should be run after every Vercel deploy when
  nearing launch.

## Primary Open Blocker

AWO-46: Stripe test-mode payment lifecycle.

Tony action still needed:

1. Add `STRIPE_SECRET_KEY` with a Stripe test secret key in Vercel.
2. Add the Vercel `/api/stripe/webhook` endpoint in Stripe test mode.
3. Add `STRIPE_WEBHOOK_SECRET` in Vercel.
4. Redeploy.
5. Run a Stripe test card payment and confirm order lifecycle moves through
   pending/paid states.

## Recommended Next Build Order

1. Finish AWO-46 with Stripe test secrets and webhook verification.
2. Add production-style payment success/failure UI around the checkout return
   path.
3. Build admin approval tools for cards/artists/orders after payment state is
   verified.
4. Add fulfillment and ownership workflows.
5. Add CI-hosted release readiness checks.
6. Add analytics/observability and authenticated E2E tests.
