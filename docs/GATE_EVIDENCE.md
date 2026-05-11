# Gate Evidence

Last updated: 2026-05-11

Linear is the source of truth for whether a phase gate is open, in review, or
done. This file keeps the repo-local evidence together so future Codex runs can
comment on Linear without re-discovering the same facts.

## Shared Release Evidence

- `npm run test:release` passed at `2026-05-11T17:11:10.901Z`.
- Release report: `.qa/release-readiness/latest.json`.
- Local route checks returned HTTP 200 for `/`, `/shop`, `/shop/wildflower-notes`,
  `/cart`, `/checkout`, `/reveal`, `/people`, `/reminders`, `/studio`,
  `/account`, and `/artists`.
- Production route checks returned HTTP 200 for the same public routes on
  `https://gpt-codex-awo-dashboard.vercel.app`.

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

Still needs Tony before Done:

- Decide whether Sentry, PostHog, Vercel Web Analytics, Vercel Speed Insights,
  and hosted CI are required now or deliberately deferred.
- Confirm the first GitHub Actions run passes after this push.
