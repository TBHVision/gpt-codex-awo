# Production Gap Audit

Linear issue: AWO-36, refreshed by AWO-56 and AWO-62

Last updated: 2026-05-12

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
buyer/artist experience polish, and final human review.

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
- `npm.cmd run test:mirror`
- `npm.cmd run build`
- `npm.cmd run test:smoke`
- `npm.cmd run test:demo`
- `npm.cmd run test:visual`
- `npm.cmd run test:release`

`test:release` now runs lint, mirror sync, build, a fresh production server,
route smoke, guided demo journey, and desktop/mobile visual QA, then writes
`.qa/release-readiness/latest.json`.
`test:demo` now covers the guided checkout/reveal path, cart quantity/remove
controls, malformed cart-storage recovery, stale buyer-session recovery on
`/account`, and core storefront route navigation.
`/admin/launch` now gives the V1.0 gate a protected launch-readiness view for
environment posture, release evidence, required docs, and Tony review blockers.
`/admin/reviews` now gives operators a protected read-only view of card,
artist, order, and reveal queues without adding risky write actions.
The first write-capable admin action is now scoped to card approve/reject and
requires Supabase-backed named admin login plus an audit event.
`/admin/audit` now shows recent `admin_audit_events` so write actions have a
visible review trail.
`/admin/fulfillment` now gives operators a protected read-only view of
paid/pending fulfillment orders, item state, reveal credential readiness, and
ownership posture without adding fulfillment write controls.
AWO-69 adds the first fulfillment transition foundation: Stripe payment success
moves reserved items into `purchased`, emits `order_paid` custody events, and a
new admin RPC defines audited future item-state transitions without exposing UI
write controls yet.
AWO-70 exposes narrow fulfillment transition controls only for Supabase-backed
named admin sessions. Temporary password admin sessions remain read-only.
AWO-71 connects ownership records to lifecycle state: paid items create pending
ownership records, and completed fulfillment activates the record and emits an
`ownership_recorded` custody event.
AWO-72 adds `/admin/ownership` so operators can see whether ownership records
exist, remain pending, activate after fulfillment, or need investigation. It is
read-only; transfer, revocation, refund, and edit workflows still need separate
audited implementation.
AWO-73 adds `/admin/custody` so operators can inspect provenance lifecycle
events such as `order_paid`, `credential_activated`, `item_fulfilled`, and
`ownership_recorded`. It is read-only and does not replay, mutate, or edit
events.
AWO-74 adds `/admin/reconciliation` so operators can see lifecycle drift across
order items, payment state, custody events, and ownership records. It is
read-only; repair and replay workflows remain future audited scopes.
AWO-76 hardens the stakeholder demo path with deterministic `/demo` checkout,
seeded `/reveal?code=AWO-DEMO-001&demo=1` playback, recipient-facing proof
copy, operator proof links, and demo QA that checks `/api/reveal/verify` when
Supabase public env vars are available.
`/api/health` now exposes a no-secret readiness endpoint for production posture
checks.

## Current Health

- Local route smoke tests pass.
- Desktop/mobile visual QA passes across golden routes.
- GitHub Actions release readiness has passed on `main`; latest confirmed run
  from this audit pass is `25726493122` for commit `90e6542`.
- Vercel production smoke and demo journey checks pass through
  `npm run test:vercel:smoke` and `npm run test:vercel:demo`.
- Public Vercel environment has Supabase and Stripe test variables configured.
- Admin routes redirect unauthenticated users to login.
- Temporary admin password gate remains in place for `/admin/*`.
- Admin login also supports Supabase Auth email/password for users whose
  `profiles.role` is `admin`, while keeping the temporary password fallback.
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
- Cart edit controls now support quantity increase/decrease, direct quantity
  entry, item removal, and full cart clearing.
- Buyer account page now clears malformed/stale browser sessions instead of
  dropping into a generic page-load failure.

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
- Tony should review the seeded stakeholder playback path at
  `/reveal?code=AWO-DEMO-001&demo=1` to confirm it is clear and gift-worthy.

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

- Temporary admin password fallback should eventually be removed after named
  Supabase admin users and audit-backed write actions are ready.
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
- AWO-64: protected `/admin/reviews` read-only review queues included in smoke
  and visual QA.
- AWO-66: audited card approve/reject actions for named Supabase admins.
- AWO-67: protected `/admin/audit` audit log visibility included in smoke and
  visual QA.
- AWO-68: protected `/admin/fulfillment` fulfillment queue visibility included
  in smoke and visual QA.
- AWO-76: stakeholder demo and seeded honoree playback are covered by
  `npm run test:demo` and the full release gate.
- `/api/health`: no-secret production posture endpoint included in smoke tests.

Remaining:

- CI-hosted release gate is confirmed working on `main`; continue checking it
  after every push that changes launch-critical flows.
- Broader write-capable approval tools are still deferred. Current admin writes
  are limited to audited card approve/reject actions for named Supabase admins.
- Fulfillment now has narrow named-admin item transition controls, but shipping,
  refunds, credential revocation, and ownership transfer/revocation still need
  separately audited workflows.
- Temporary password admin sessions remain read-only for fulfillment actions.
- Observability setup for production errors, analytics, and performance is still
  planned rather than configured.
- Browser-based authenticated end-to-end tests are still parked until account
  flows stabilize further. The current demo journey intentionally avoids
  creating real Supabase users.
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

1. Keep V1.0 focused on a demo-ready stakeholder walkthrough: shopper path,
   honoree playback, buyer account recovery, and obvious dead-end removal.
2. Decide and configure observability: Sentry for exceptions, plus either
   Vercel Analytics/Speed Insights or PostHog for product behavior.
3. Build the next audited admin write controls only where they unblock launch:
   card/artist approval, fulfillment updates, refunds, or revoke/transfer.
4. Add authenticated E2E tests for buyer and admin flows once the account model
   is no longer changing daily.
5. Convert remaining launch gaps into specific Linear issues instead of using
   broad phase percentages as a proxy for readiness.
