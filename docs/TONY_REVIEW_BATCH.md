# Tony Review Batch

Last updated: 2026-05-12

This is the batched list of things Tony should review or configure when ready.
Codex should keep working around this list and avoid stopping unless a missing
item blocks the next code change.

## Browser Reviews

- V1.0: Review `/demo` as the stakeholder walkthrough starting point. It should
  make the shop, checkout, reveal, and proof-layer story understandable without
  requiring a developer narration.
- V1.0: Review `/reveal?code=AWO-DEMO-001&demo=1` as the demo honoree
  playback path. Use code `AWO-DEMO-001` and PIN `1234` if the form is locked.
- V0.2: Review `/shop`, card detail, `/cart`, and `/checkout` for buyer clarity.
  Cart now supports quantity editing, remove item, and clear cart. Checkout
  still tells the user when Stripe is not configured in the current environment.
- V0.3: Review `/reveal` on a phone-sized viewport for recipient clarity and
  gift-worthiness.
- V0.4: Review `/people`, `/reminders`, and `/account` for warmth and usefulness.
  `/account` should recover to the sign-in/create-account view if a stale saved
  browser session exists.
- V0.5: Review `/artists` and `/studio` for artist confidence and submission
  clarity.
- V0.6: Review `/admin/ops` for whether the read-only operations model is
  trustworthy enough.
- AWO-78: Review `/studio` and `/admin/reviews` for the richer artist
  application packet: contact email, medium, portfolio, human-origin statement,
  commercial-terms acknowledgment, and named-admin approval clarity.
- AWO-81: Review `/admin/fulfillment` and `/admin/ownership` for the new
  lifecycle exception controls. `Record Refund` is internal lifecycle state only
  and does not execute a live Stripe refund.
- AWO-63: Review `/admin/launch` as the final V1.0 launch-readiness rollup.

## External Checks

- GitHub Actions: latest confirmed `main` release-readiness run is green
  (`25742908637`) on commit `a022663`; keep confirming after launch-critical
  pushes.
- Vercel: confirm production redeployed after the latest push and that protected
  admin routes still require login. Direct Vercel deploys hit the daily
  deployment limit during the overnight run, so production may lag behind the
  latest GitHub commit until the limit clears.
- Health endpoint: review `/api/health` on the deployed URL to confirm it
  reports configured services and observability posture without exposing secret
  values.
- Vercel smoke/demo: `npm run test:vercel:smoke` and
  `npm run test:vercel:demo` passed against the deployed site after commit
  `a022663`.
- Supabase: create or confirm at least one named admin user whose
  `profiles.role` is `admin` before relying on Supabase admin login.
- Stripe: keep test mode only until Tony explicitly approves live charges.

## Decisions To Make Later

- Whether Sentry is required before V1.0 or intentionally deferred.
- Whether PostHog, Vercel Web Analytics, or Vercel Speed Insights are required
  before V1.0 or intentionally deferred.
- Whether production should disable the temporary admin password entirely or
  restrict it to local/development after a real named admin login is confirmed.
  `/api/health` now reports this posture under `services.adminAuth`.
- Whether the next investor/artist demo should intentionally use seeded demo
  records or real Stripe/Supabase records created during the session.

## Current Default

Until Tony decides otherwise:

- Linear remains the source of truth.
- Admin write tools stay narrow and named-admin only.
- Stripe live charges stay disabled.
- Stripe live refunds stay disabled.
- Temporary dashboard password fallback stays enabled until named Supabase admin
  login is proven with a real admin account.
