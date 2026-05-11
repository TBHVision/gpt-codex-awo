# Production Gap Audit

Linear issue: AWO-36

Date: 2026-05-10

## Executive Summary

The first full shell pass is complete and the app is navigable locally and on Vercel. Production Supabase public catalog wiring is working: `/shop` reads seeded `published_cards` from Supabase and no longer renders missing-environment warnings.

The site is not launch-ready yet. The strongest next move is to replace demo-only buyer flows with real Supabase-backed account and order flows, then wire recipient reveal and admin operations to those records.

## Verified Surfaces

Reviewed locally at `http://127.0.0.1:3000`:

- `/`
- `/shop`
- `/shop/birthday-light`
- `/cart`
- `/checkout`
- `/reveal`
- `/artists`
- `/people`
- `/reminders`
- `/studio`
- `/admin/build`
- `/admin/ops`

Reviewed on production with smoke coverage at `https://gpt-codex-awo-dashboard.vercel.app`.

## Current Health

- Local route smoke test passes.
- Production route smoke test passes.
- Production `/shop` returns seeded Supabase cards.
- Admin routes redirect to login when unauthenticated.
- Admin login works locally with the configured temporary password.
- Storefront navigation works after the Codex browser reset and native-link hardening.

## Buyer Gaps

1. Checkout is still a shell.
   - Current state: recipient, occasion, and note fields exist, but no order draft is written.
   - Risk: a user can believe they completed a meaningful action when nothing durable exists.
   - Next issue: AWO-37.

2. Cart is browser-local only.
   - Current state: cart lives in localStorage.
   - Risk: cart disappears across devices/browsers and cannot be recovered after account creation.
   - Next issue: tie into AWO-37 and AWO-38.

3. Buyer identity does not exist yet.
   - Current state: public browsing works, but no buyer auth/session path exists.
   - Risk: people, reminders, cart, and order history cannot become real without identity.
   - Next issue: AWO-38.

## Recipient Reveal Gaps

1. Reveal accepts any demo code and PIN.
   - Current state: route frames the future experience but does not validate real secrets.
   - Risk: the core AWO trust story is still a prototype.
   - Recommended next issue: create real QR/PIN reveal validation after order draft records exist.

2. Reveal evidence is static.
   - Current state: artist story, capture evidence, chain of custody, and ownership preview are demo content.
   - Risk: recipient experience does not prove actual provenance yet.
   - Recommended next issue: wire reveal page to Supabase order/card/evidence records.

## Artist Gaps

1. Artists page uses demo profiles.
   - Current state: content explains the intended creator story surface but is not real onboarding.
   - Risk: no trustworthy creator directory or artist-managed profile yet.

2. Studio is local demo storage.
   - Current state: drafts and evidence checklist persist in localStorage.
   - Risk: artist work cannot become shared, approved, or published.
   - Recommended next issue: Supabase-backed artist profile and draft submission flow.

## Admin And Ops Gaps

1. `/admin/ops` is still placeholder operational visibility.
   - Current state: order queue, reveal events, and system health are static.
   - Risk: admin cannot monitor actual orders/reveals.
   - Next issue: AWO-40.

2. Admin auth is temporary.
   - Current state: app-level password protects `/admin/*`.
   - Risk: no per-user admin identity, audit trail, or role enforcement.
   - Recommended next issue: replace admin password gate with Supabase Auth admin role after buyer auth path is stable.

## Data/Auth Gaps

1. Buyer-owned records are not persisted.
   - People and reminders are local/demo only.
   - Next issue: AWO-39.

2. Order/reveal lifecycle needs a real state model.
   - Draft order, purchased order, physical card, QR/PIN reveal, custody, and ownership should have explicit state transitions.
   - Recommended next issue: define lifecycle states before wiring payment or fulfillment.

3. Service boundaries need to stay strict.
   - Public catalog can use anon key.
   - Writes that create orders, reveal credentials, or admin views should use server-mediated routes/actions and RLS-safe policies.

## QA And UX Gaps

1. Mobile visual QA is not yet deep enough.
   - Smoke tests prove routes respond, not that layouts are polished.
   - Recommended next issue: desktop/mobile screenshot review for key flows.

2. Shell copy is intentionally visible but should shrink as features become real.
   - Checkout, reveal, artists, people, reminders, studio, and admin ops all still use explicit shell/demo language.
   - This is good for honesty now, but it must be removed as flows become real.

3. Vercel deployment preview may show 403.
   - Current behavior: deployment preview card can show Vercel Authentication/protection behavior.
   - Real route testing should use direct URLs and smoke tests, not the preview thumbnail.

## Recommended Build Order

1. AWO-37: Supabase-backed checkout/order draft.
2. AWO-38: Buyer Supabase Auth path.
3. AWO-39: Persist People and Reminders to Supabase.
4. New issue: real QR/PIN reveal validation and dynamic evidence.
5. New issue: artist profile and draft submission persistence.
6. AWO-40: Admin ops reads real operational data.
7. New issue: mobile/visual QA pass across the golden paths.

## Verification Evidence

Commands run:

```powershell
npm run test:smoke
$env:SMOKE_BASE_URL='https://gpt-codex-awo-dashboard.vercel.app'; npm run test:smoke
```

Both local and production smoke suites passed.
