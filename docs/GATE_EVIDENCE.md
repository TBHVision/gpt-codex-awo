# Gate Evidence

Last updated: 2026-05-12

Linear is the source of truth for whether a phase gate is open, in review, or
done. This file keeps the repo-local evidence together so future Codex runs can
comment on Linear without re-discovering the same facts.

## Shared Release Evidence

- `npm run test:release` passed at `2026-05-12T16:52:35.000Z`.
- Release report: `.qa/release-readiness/latest.json`.
- Local route checks returned HTTP 200 for `/`, `/shop`, `/demo`,
  `/shop/wildflower-notes`, `/cart`, `/checkout`, `/reveal`, `/people`,
  `/reminders`, `/studio`, `/account`, `/artists`, and `/api/health`.
- Production route checks returned HTTP 200 for the same public routes on
  `https://gpt-codex-awo-dashboard.vercel.app`.
- GitHub Actions release-readiness passed on `main` in run `25749258943` for
  commit `62cfa07`.
- `npm run test:vercel:smoke` passed against
  `https://gpt-codex-awo-dashboard.vercel.app`, including `/api/health`,
  protected admin login redirects, and an exact deployed-commit match to local
  Git `HEAD`.
- Deployed `/api/health` reports Vercel production serving the expected commit
  with Supabase, Stripe, webhook, and admin-gate posture booleans all present.
- `npm run test:vercel:demo` passed against
  `https://gpt-codex-awo-dashboard.vercel.app`, including guided checkout,
  seeded reveal playback, live `/api/reveal/verify`, cart controls, account
  stale-session recovery, and navigation.

## V0.2 Public Shop

Codex evidence:

- Supabase `published_cards` returns five public cards:
  `coastal-morning`, `misty-pines`, `morning-song`, `wildflower-notes`, and
  `with-all-my-heart`.
- Browser evidence confirmed `/shop` renders `Wildflower Notes` and prices.
- Browser evidence confirmed `/shop/wildflower-notes` has one `Add to cart`
  action.
- Browser evidence confirmed adding `Wildflower Notes` makes it visible in
  `/cart` and exposes checkout navigation.
- Browser evidence confirmed `/checkout` exposes recipient, occasion, message,
  draft save, and test payment controls.
- Checkout now includes inline cart quantity and removal controls, so buyers can
  correct an order from the checkout summary without returning to `/cart`.
- Stripe test checkout is complete through AWO-46.

Still needs Tony before Done:

- Human review that the public shop is acceptable enough to close V0.2.
- Human review that signed-in buyer cart/order behavior feels understandable in
  the actual browser experience.

## V0.3 Honoree Reveal

Codex evidence:

- `/api/reveal/verify` with `AWO-DEMO-001` and PIN `1234` returns HTTP 200 and
  a successful Supabase-backed payload.
- Successful payload includes card, artist, checkout reference, recipient,
  evidence items, custody steps, and ownership summary.
- Wrong PIN attempts return a safe failure payload without card, artist, custody,
  evidence, or ownership details.
- The demo credential lock rule was exercised during testing, then reset with a
  linked Supabase query so the demo can be reused.
- Browser evidence confirmed `/reveal` renders card-code and PIN entry.

Still needs Tony before Done:

- Mobile recipient review: Tony should confirm the reveal experience feels clear
  and gift-worthy on a phone-sized viewport.

## V0.4 My People + Buyer Tools

Codex evidence:

- Browser evidence confirmed `/people` renders the People tool and add-person
  path.
- Browser evidence confirmed `/reminders` renders reminder planning and
  add-reminder path.
- `npm run test:demo` verifies People and Reminders expose deterministic
  card-discovery links for seeded birthday and support/encouragement planning
  intents.
- Browser evidence confirmed `/account` renders the account entry path.
- The code supports signed-in Supabase-backed people, occasions, reminders, and
  order history with guest browser-local fallback.
- AWO-53 and AWO-54 verified buyer order ownership and signed-in buyer cart
  persistence.

Still needs Tony before Done:

- Human review that People + Reminders + Account feel warm and useful, not like
  a cold CRM.

## V0.5 Artist Studio

Codex evidence:

- Supabase `artists` returns approved public profiles for `HatchVision Studio`
  and `Codex Artist Test`.
- Browser evidence confirmed `/artists` renders public artist content.
- Browser evidence confirmed `/studio` renders the Artist Studio and draft save
  path.
- The code supports signed-in artist/admin Supabase draft persistence with a
  guest browser-local fallback.
- Existing production gaps around deeper approvals are carried into Admin/Ops and
  later production hardening.

Still needs Tony before Done:

- Human review that the artist confidence, provenance checklist, and submission
  clarity are acceptable for this phase.

## V0.6 Admin + Ops

Codex evidence is attached to AWO-61. It includes release readiness, desktop and
mobile `/admin/ops` visual QA, and service-role operational metric checks.

Still needs Tony before Done:

- Human review that `/admin/ops` is trustworthy enough as a read-only ops view.

## V0.7 QA + Observability

Codex evidence is attached to AWO-62. `docs/OBSERVABILITY_PLAN.md` defines the
recommended stack and deferral options.

Additional Codex evidence:

- `.github/workflows/ci.yml` runs `npm run test:release` on pushes to `main`
  and pull requests.
- `scripts/visual-qa.mjs` now supports Linux Chrome paths used by GitHub-hosted
  runners as well as the existing Windows Chrome paths.
- Local `npm run test:release` passed after the CI workflow and visual QA runner
  changes.
- `/admin/launch` adds a protected V1.0 launch-readiness surface and is covered
  by smoke and visual QA.
- `/admin/reviews` adds a protected read-only review queue for launch readiness
  and is covered by smoke and visual QA.
- `/admin/audit` adds protected audit-log visibility and is covered by smoke
  and visual QA.
- `/admin/fulfillment` adds protected read-only fulfillment queue visibility and
  is covered by smoke and visual QA.
- `/admin/ownership` adds protected read-only ownership records visibility and
  is covered by smoke and visual QA.
- `/admin/custody` adds protected read-only custody event visibility and is
  covered by smoke and visual QA.
- `/admin/reconciliation` adds protected read-only lifecycle mismatch
  visibility and is covered by smoke and visual QA.

Still needs Tony before Done:

- Decide whether Sentry, PostHog, Vercel Web Analytics, Vercel Speed Insights,
  and hosted CI are required now or deliberately deferred.
- Confirm hosted CI should remain the accepted V0.7 baseline now that the latest
  `main` release-readiness run is green.

## V1.0 Launch-Ready Instance

Codex evidence:

- `/demo` provides a guided stakeholder walkthrough linking shop, checkout,
  seeded reveal, and protected proof-layer review pages.
- Demo journey cards now point to deterministic destinations: checkout opens
  `/checkout?demo=1`, and reveal opens `/reveal?code=AWO-DEMO-001&demo=1`.
- `/` now acts as the public stakeholder jump-off surface instead of a shell:
  it presents the AWO brand, shopper/artist/recipient/investor paths, seeded
  reveal credentials, and protected operator proof links.
- Cart and account support copy now reflects the current system state: Stripe
  is sandbox/test-mode until approval, signed-in carts sync through Supabase,
  and People/Reminders are account-aware rather than future-only.
- The checkout summary now has item edit controls, and `npm run test:demo`
  verifies quantity increase and removal directly on `/checkout`.
- People and Reminders support copy now describes account-backed activity and
  planning queues without implying those tools are still purely local.
- `/reveal?code=AWO-DEMO-001&demo=1` provides a deterministic demo honoree
  playback path with the seeded code/PIN, sender message, evidence, custody
  steps, and honest pending ownership posture.
- `/api/reveal/verify` is exercised by `npm run test:demo` when Supabase public
  env vars are available. CI skips only this live Supabase assertion when those
  env vars are absent, while still checking the rendered demo playback.
- The deployed Vercel app passed `npm run test:vercel:demo`, including the live
  Supabase-backed reveal API assertion.
- `/api/health` exposes a no-secret readiness/service posture for production
  checks, including deployment metadata so Vercel can be tied back to the
  serving branch/commit without exposing secrets.
- AWO-77 adds `generate_order_item_reveal_credential(...)`, a named-admin
  Supabase RPC that creates QR/PIN credential packets for paid items, stores
  only the hashed PIN, emits custody evidence, and writes an admin audit event.
- `npm run test:release` passed locally and in GitHub Actions after the
  stakeholder playback hardening.

Still needs Tony before Done:

- Human review that the stakeholder demo is clear enough for an investor/artist
  walkthrough.
- Human review that the honoree playback feels gift-worthy and does not
  overclaim ownership before fulfillment activation.
- Decide whether observability and live-payment deferrals are acceptable for the
  first stakeholder demo.
- Follow-up launch gaps are now explicit Linear issues: AWO-77 for production
  QR/PIN generation, AWO-78 for artist onboarding/approval, AWO-79 for
  observability setup, AWO-80 for authenticated E2E, AWO-81 for
  refund/revocation/transfer workflows, and AWO-82 for removing the temporary
  admin password fallback.

## AWO-78 Artist Review Evidence

Codex evidence:

- The `artist_status` enum now includes `rejected`, separating a rejected
  application decision from a later `suspended` enforcement state.
- `/admin/reviews` now exposes Approve/Reject actions for `pending_review`
  artists when a named Supabase admin session is active.
- Artist review actions require a profile with `role = admin`, update only
  `pending_review` artist rows, and write `admin_audit_events` with
  `artist_approved` or `artist_rejected`.
- The `artists_enforce_status_boundary` trigger prevents non-admin users from
  self-promoting artist profiles into `approved`, `rejected`, or `suspended`
  states.
- `/studio` now includes a signed-in user artist application path that creates
  `pending_review` artist rows without making them public.
- Supabase migration `20260512133000` adds an artist application packet:
  contact email, medium/discipline, origin statement, portfolio URL,
  commercial-terms acknowledgment, and named-admin review metadata.
- `/studio` now requires the application packet before a signed-in user can
  submit for artist review.
- `/admin/reviews` now shows the artist application packet alongside each
  artist review row so approval is based on evidence, not only the public name.
- Artist approval/rejection writes `reviewed_at` and `reviewed_by_profile_id`
  on the artist row in addition to the existing admin audit event.
- `npm run test:release` passed locally with authenticated E2E coverage for the
  richer artist packet at `2026-05-12T14:24:40.212Z`.

Remaining:

- Real external identity verification, payout setup, and legal/commercial terms
  approval remain open under AWO-78 as human/business gates.

## AWO-80 Authenticated E2E Evidence

Codex evidence:

- `scripts/authenticated-e2e.mjs` creates disposable Supabase buyer and admin
  auth users with matching profiles, then deletes the test users at the end of
  the run.
- `npm run test:auth` exercises authenticated buyer account loading,
  Supabase-backed People save, Supabase-backed Reminder save, signed-in artist
  application submission, named-admin login, artist approval, and the approval
  audit event.
- The authenticated browser harness also covers the buyer create-account path
  when Supabase requires email confirmation, so `/account` stays on-page with a
  clear next step instead of feeling like a broken sign-up.
- `npm run test:release` now includes the authenticated E2E step after smoke
  and demo tests and before visual QA.
- Local `npm run test:release` passed with the authenticated step at
  `2026-05-12T14:56:32.481Z`.
- Vercel production is serving commit `a022663`, and `npm run
  test:vercel:smoke` plus `npm run test:vercel:demo` passed against
  `https://gpt-codex-awo-dashboard.vercel.app`.
- `npm run test:stripe:checkout` creates a deployed Stripe sandbox Checkout
  Session through `/api/checkout/session`, verifies the returned `cs_test_`
  session and `checkout.stripe.com` URL, then deletes the generated Supabase
  smoke order when service-role credentials are available. Stripe-side session
  expiration requires a local `STRIPE_SECRET_KEY`.
- `npm run test:vercel:all` passed after adding the bundled deployed-site
  verification command.
- `npm run test:vercel:all` now starts with `npm run test:vercel:fresh`, which
  compares `/api/health` deployment metadata to the latest app-source commit
  before deeper deployed checks run. This prevents stale Vercel builds from
  looking like application route failures while allowing docs/scripts-only
  commits to land without requiring a new app bundle.
- `npm run test:demo` now includes `PASS /checkout inline cart controls`, and
  GitHub Actions passed that release gate in run `25749258943`.

Remaining:

- Production freshness is currently blocked because Vercel is still serving
  app commit `db33937` while the latest app-source commit is `62cfa07`.
- Hosted CI will run the harness in skip mode unless Supabase service-role test
  secrets are added to GitHub Actions.

## AWO-79 Observability Posture Evidence

Codex evidence:

- `/admin/launch` now includes an Observability section for error tracking,
  product analytics, performance monitoring, and uptime monitoring posture.
- `/api/health` now returns no-secret boolean observability posture flags under
  `services.observability`.
- Vercel Web Analytics and Speed Insights components are wired into the root
  app shell so deployed pages can emit first-party analytics/performance
  signals once Vercel collection is available.
- `docs/OBSERVABILITY_PLAN.md` lists the recognized optional environment keys
  without requiring Tony to choose or configure a provider during this run.
- Vercel production is serving commit `b381b48`, and `npm run
  test:vercel:smoke` passed against `https://gpt-codex-awo-dashboard.vercel.app`.

Remaining:

- Tony still needs to choose/configure Sentry or explicitly defer exception
  tracking.
- Tony should confirm Vercel Web Analytics and Speed Insights are collecting in
  the Vercel dashboard before AWO-79 can be called Done.

## AWO-82 Admin Fallback Posture Evidence

Codex evidence:

- `/admin/launch` now reports the temporary admin fallback as its own launch
  policy item instead of hiding it inside generic admin-secret readiness.
- `/api/health` now reports `services.adminAuth` booleans for named-admin login
  configuration, session-token configuration, temporary password fallback, and
  production fallback risk.
- `docs/AUTH_SESSION_MODEL.md` documents the safe future path: keep
  `AWO_ADMIN_SESSION_TOKEN`, confirm a named Supabase admin login, then remove
  `AWO_ADMIN_PASSWORD`.
- Vercel production health now reports `temporaryPasswordProductionRisk = true`,
  which is correct while the fallback remains intentionally enabled.
- The admin login now supports `AWO_DISABLE_TEMP_ADMIN_PASSWORD=true` as a
  staged path to hide and reject the temporary password fallback after named
  Supabase admin login is confirmed. `/api/health` reports both enabled and
  disabled fallback posture without exposing secret values.
- The shared admin session banner now visually distinguishes named admin
  sessions from temporary password fallback sessions and links directly to the
  launch auth policy surface.

Remaining:

- Tony still needs to confirm the real named admin account and decide whether
  the temporary fallback is removed entirely or kept local/dev-only.

## AWO-78 Artist Onboarding Evidence

Codex evidence:

- `/studio` now explains the production artist onboarding sequence: account
  requirement, artist review request, proof packet preparation, and named-admin
  approval.
- Guest/local users now see a clear account-required artist application panel
  instead of only a draft tool.
- The Studio roadmap links directly to the protected admin review queue and the
  seeded example artist profile.
- Local `npm run test:release` passed after the Studio onboarding polish at
  `2026-05-12T18:20:46.535Z`.

Remaining:

- Real artist media upload/storage, payout setup, and commercial terms remain
  future scoped until Tony selects production policies and assets.

## AWO-81 Lifecycle Exception Evidence

Codex evidence:

- Supabase migrations `20260512123500` and `20260512124000` are applied locally
  and remotely.
- `admin_transition_lifecycle_exception(...)` now defines named-admin guarded
  transitions for `refund_item`, `revoke_credential`, `revoke_ownership`, and
  `transfer_ownership`.
- Refund exception handling records internal item/order/ownership/reveal state
  only; it does not call Stripe or move live money.
- Lifecycle exception transitions write `admin_audit_events` and emit custody
  evidence for credential revocation, item refund, ownership transfer, and
  ownership revocation.
- `npm run test:lifecycle` passed against Supabase and verified the RPC exists
  while enforcing the named-admin guard.
- `/admin/fulfillment` now exposes named-admin exception actions for internal
  refund state recording and credential revocation.
- `/admin/ownership` now exposes named-admin ownership revocation and transfer
  actions on top of the protected RPC.
- Authenticated E2E now verifies a named admin can inspect `/admin/fulfillment`
  and `/admin/ownership` operator pages after login without clicking exception
  actions.
- Local `npm run test:release` passed after the operator UI wiring at
  `2026-05-12T14:24:40.212Z`.

Remaining:

- Live Stripe refund execution remains disabled until Tony explicitly approves
  live-money operations.
