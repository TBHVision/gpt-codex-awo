# Production Gap Audit

Linear issue: AWO-36, refreshed by AWO-56 and AWO-62

Last updated: 2026-05-11

## Executive Summary

The AWO build is no longer just a shell. The public storefront reads the
Supabase catalog, checkout creates durable draft orders, buyer accounts exist,
people/reminders persist for signed-in buyers, signed-in carts sync to Supabase,
order history is account-owned, reveal validation is server-mediated, artist
drafts persist for signed-in creators, and admin ops shows read-only lifecycle
queues.

Stripe test-mode checkout is now verified end to end. The remaining production
work is no longer "can we collect a test payment"; it is hardening the launch
posture around observability, admin actions, fulfillment, ownership transfer,
and final human review.

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
`/admin/launch` now gives the V1.0 gate a protected launch-readiness view for
environment posture, release evidence, required docs, and Tony review blockers.

## Current Health

- Local route smoke tests pass.
- Desktop/mobile visual QA passes across golden routes.
- Public Vercel environment has Supabase and Stripe test variables configured.
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
- AWO-46: Stripe sandbox payment lifecycle is verified; a test Checkout Session
  moved an order through `pending_payment` to `paid` by webhook.
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
- AWO-46: Stripe test-mode Checkout Session and webhook lifecycle is verified.

Remaining:

- Fulfillment automation and ownership transfer workflows.
- Production reporting/analytics beyond the current read-only ops snapshot.

## QA And Release Status

Completed:

- AWO-44: Desktop/mobile visual QA harness.
- AWO-49: Mobile nav compactness.
- AWO-52: Mobile storefront density polish.
- AWO-55: One-command release readiness gate.
- AWO-63 support: protected `/admin/launch` launch-readiness surface included
  in smoke and visual QA.

Remaining:

- CI-hosted release gate has been added, but the first remote GitHub Actions run
  should be checked after push to confirm repository secrets and Chrome are
  available in the runner.
- Observability setup for production errors, analytics, and performance is still
  planned rather than configured.
- Browser-based authenticated end-to-end tests are still parked until account
  flows stabilize further.
- Production smoke/visual checks should be run after every Vercel deploy when
  nearing launch.

## Recent Payment Evidence

AWO-46 is complete from the test-mode perspective.

Evidence captured on 2026-05-11:

- Vercel production and preview env vars include `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Stripe test checkout session `cs_test_a1tz...` was created from production.
- Tony completed Stripe test card payment with `4242 4242 4242 4242`.
- Supabase order `AWO-DRAFT-F2EC02824E` is `status = paid` and
  `payment_status = paid`.
- `/checkout?payment=success&order=...` shows a success confirmation instead of
  dropping the buyer into an empty checkout form.

## Recommended Next Build Order

1. Finish V0.6 gate review after Tony reviews `/admin/ops`.
2. Add the V0.7 observability and CI posture.
3. Build admin approval tools for cards/artists/orders after payment state is
   verified.
4. Add fulfillment and ownership workflows.
5. Add authenticated E2E tests once account/session mechanics stabilize.
