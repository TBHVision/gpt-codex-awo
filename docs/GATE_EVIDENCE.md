# Gate Evidence

Last updated: 2026-05-12

Linear is the source of truth for whether a phase gate is open, in review, or
done. This file keeps the repo-local evidence together so future Codex runs can
comment on Linear without re-discovering the same facts.

## Shared Release Evidence

- `npm run test:release` passed at `2026-05-12T13:20:30.599Z`.
- Release report: `.qa/release-readiness/latest.json`.
- Local route checks returned HTTP 200 for `/`, `/shop`, `/demo`,
  `/shop/wildflower-notes`, `/cart`, `/checkout`, `/reveal`, `/people`,
  `/reminders`, `/studio`, `/account`, `/artists`, and `/api/health`.
- Production route checks returned HTTP 200 for the same public routes on
  `https://gpt-codex-awo-dashboard.vercel.app`.
- GitHub Actions release-readiness passed on `main` in run `25728521994` for
  commit `bfc0c14`.
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
- Cart and account support copy now reflects the current system state: Stripe
  is sandbox/test-mode until approval, signed-in carts sync through Supabase,
  and People/Reminders are account-aware rather than future-only.
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
- `npm run test:release` now includes the authenticated E2E step after smoke
  and demo tests and before visual QA.
- Local `npm run test:release` passed with the authenticated step at
  `2026-05-12T14:24:40.212Z`.

Remaining:

- Production cannot be redeployed with this change until the current Vercel
  daily deployment limit clears.
- Hosted CI will run the harness in skip mode unless Supabase service-role test
  secrets are added to GitHub Actions.

## AWO-79 Observability Posture Evidence

Codex evidence:

- `/admin/launch` now includes an Observability section for error tracking,
  product analytics, performance monitoring, and uptime monitoring posture.
- `/api/health` now returns no-secret boolean observability posture flags under
  `services.observability`.
- `docs/OBSERVABILITY_PLAN.md` lists the recognized optional environment keys
  without requiring Tony to choose or configure a provider during this run.

Remaining:

- Tony still needs to choose/configure Sentry, Vercel Web Analytics/Speed
  Insights, PostHog, or explicit deferrals before AWO-79 can be called Done.

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

Remaining:

- Tony still needs to confirm the real named admin account and decide whether
  the temporary fallback is removed entirely or kept local/dev-only.

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
