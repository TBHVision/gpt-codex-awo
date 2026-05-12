# Tony Review Batch

Last updated: 2026-05-12

This is the batched list of things Tony should review or configure when ready.
Codex should keep working around this list and avoid stopping unless a missing
item blocks the next code change.

## Browser Reviews

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
- AWO-64: Review `/admin/reviews` for whether read-only review queues are useful
  before we add write-capable admin actions.
- AWO-63: Review `/admin/launch` as the final V1.0 launch-readiness rollup.

## External Checks

- GitHub Actions: latest confirmed `main` release-readiness run is green
  (`25713427285`); keep confirming after launch-critical pushes.
- Vercel: confirm production redeployed after the latest push and that protected
  admin routes still require login.
- Supabase: create or confirm at least one named admin user whose
  `profiles.role` is `admin` before relying on Supabase admin login.
- Stripe: keep test mode only until Tony explicitly approves live charges.

## Decisions To Make Later

- Whether Sentry is required before V1.0 or intentionally deferred.
- Whether PostHog, Vercel Web Analytics, or Vercel Speed Insights are required
  before V1.0 or intentionally deferred.
- Whether write-capable admin actions should start with card approval, artist
  approval, fulfillment updates, or refund/revoke controls.
- Whether the next investor/artist demo should intentionally use seeded demo
  records or real Stripe/Supabase records created during the session.

## Current Default

Until Tony decides otherwise:

- Linear remains the source of truth.
- Admin tools stay read-only unless a specific issue adds audited write actions.
- Stripe live charges stay disabled.
- Temporary dashboard password fallback stays enabled until named Supabase admin
  login is proven with a real admin account.
