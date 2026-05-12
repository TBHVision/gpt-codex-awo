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
controls, inline checkout cart quantity/remove controls, malformed cart-storage
recovery, stale buyer-session recovery on `/account`, and core storefront route
navigation.
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
AWO-77 adds the first production QR/PIN generation boundary: a named-admin-only
Supabase RPC generates a unique reveal code and raw PIN, stores only the hashed
PIN, activates the reveal credential, and returns the raw PIN once for
print/fulfillment handoff.
AWO-78 improves the Artist Studio launch path so guest/local users see the
account-required onboarding sequence, artist review expectations, proof packet
requirements, admin approval posture, and links to review/profile surfaces.
AWO-76 hardens the stakeholder demo path with deterministic `/demo` checkout,
seeded `/reveal?code=AWO-DEMO-001&demo=1` playback, recipient-facing proof
copy, operator proof links, and demo QA that checks `/api/reveal/verify` when
Supabase public env vars are available.
The public Artists fallback now points to the seeded HatchVision Studio profile
instead of a non-existent placeholder slug, keeping demo navigation
deterministic when Supabase artist rows are unavailable.
The Shop sort control now performs real query-param sorting for newest,
price-low, price-high, and A-Z instead of presenting an inert button.
The homepage now functions as a stakeholder command surface rather than a
placeholder: it presents the AWO brand, review links for shopper checkout,
artist story, honoree reveal, investor demo, and protected operator proof pages.
`/api/health` now exposes a no-secret readiness endpoint for production posture
checks.

## Current Health

- Local route smoke tests pass.
- Desktop/mobile visual QA passes across golden routes.
- GitHub Actions release readiness has passed on `main`; latest confirmed run
  from this audit pass is `25749258943` for commit `62cfa07`.
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
- Checkout now exposes compact item quantity and removal controls in the order
  summary, so a buyer can fix the order without backtracking to the cart page.
- Signed-in cart edits now use an exact save path after user edits, preventing
  removed items from being resurrected by merge-only account sync.
- Buyer account page now clears malformed/stale browser sessions instead of
  dropping into a generic page-load failure.
- Buyer account page now gives practical next actions after sign-in: People,
  Reminders, Cart, Shop Cards, Demo Checkout, and Demo Reveal.
- Checkout now reads `/api/health` before enabling Stripe test payment, so a
  local environment without Stripe secrets shows a clear draft/hosted-demo path
  instead of letting the buyer hit a known-dead payment action.

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

- Production card-specific QR/PIN generation now has a named-admin generation
  foundation. Remaining work is rotation/revocation UX and print/fulfillment
  packet operational review.
- Final recipient copy/art direction still needs human review when real product
  cards exist.
- Tony should review the seeded stakeholder playback path at
  `/reveal?code=AWO-DEMO-001&demo=1` to confirm it is clear and gift-worthy.

## Artist Status

Completed:

- AWO-42: Public artists read approved Supabase artist profiles.
- Signed-in artist/admin paths can persist studio draft cards and provenance
  checklist state through RLS.
- AWO-78 now has the first production admin review path: named Supabase admins
  can approve or reject `pending_review` artist rows from `/admin/reviews`, and
  every action writes `admin_audit_events`.
- AWO-78 now has the first signed-in artist application path from `/studio` and
  database guardrails that keep non-admin users from self-promoting artist
  approval status.
- AWO-78 now captures an artist application packet before review: contact
  email, medium/discipline, portfolio URL, human-origin statement, and
  commercial-terms acknowledgment. `/admin/reviews` shows this packet and
  records named-admin review metadata.

Remaining:

- Artist onboarding is not production-complete. Applicants still need profile
  verification steps and operational payout/commercial review before launch.
- Real artist identity verification, payout/commercial workflows, and legal
  terms acceptance are still human/business gates.

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
- Real approval tools for users, fraud review, fulfillment exceptions, and
  commercial onboarding still need to be built. Card and artist approve/reject
  paths now exist for named Supabase admins.

## Data And Lifecycle Status

Completed:

- AWO-43: Lifecycle model documented.
- AWO-45: Lifecycle schema foundations added for payments, fulfillment, item
  status, reveal credential status, custody events, and ownership records.
- AWO-46: Stripe test-mode Checkout Session and webhook lifecycle is verified.

Remaining:

- Fulfillment automation and ownership transfer workflows.
  Refund/revocation/transfer exception handling is tracked by AWO-81.
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
- Fulfillment now has narrow named-admin item transition controls, internal
  refund-state recording, and credential revocation controls. Ownership now has
  named-admin transfer and revocation controls. Live Stripe refund execution,
  shipping labels, and destructive production policies still remain explicit
  approval gates.
- Temporary password admin sessions remain read-only for fulfillment actions.
- Replacing the shared temporary admin password before launch is tracked by
  AWO-82. `/admin/launch` and `/api/health` now report the temporary fallback
  posture separately so it is visible as a launch policy risk rather than a
  hidden implementation detail.
- Observability setup for production errors, analytics, and performance is still
  planned rather than configured. `/admin/launch` and `/api/health` now expose
  no-secret posture checks for error tracking, analytics, performance
  monitoring, and uptime monitoring. Provider selection/configuration is still
  tracked by AWO-79.
- Authenticated end-to-end coverage now exists for buyer account loading,
  People/Reminders persistence, artist application submission, named-admin
  login, audited artist approval, artist application packet persistence, and
  audit-event verification. Tracked by AWO-80. Hosted CI still needs Supabase
  test secrets before it can run this harness outside skip mode.
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
2. Decide and configure observability via AWO-79: Sentry for exceptions, plus
   either Vercel Analytics/Speed Insights or PostHog for product behavior.
3. Build the next audited admin write controls only where they unblock launch:
   artist verification, fulfillment updates, refunds, or revoke/transfer. Use
   AWO-78 for remaining artist onboarding and AWO-81 for any future live-money
   Stripe refund execution on top of the protected lifecycle exception
   foundation.
4. Promote authenticated E2E tests for buyer and admin flows from local
   service-role evidence into hosted CI by adding the required Supabase test
   secrets for AWO-80.
5. Convert remaining launch gaps into specific Linear issues instead of using
   broad phase percentages as a proxy for readiness.
