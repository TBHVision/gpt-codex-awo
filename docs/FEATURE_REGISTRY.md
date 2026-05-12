# Feature Registry

This registry is the GPT-Codex source of truth for feature status. A feature is not marked verified until Tony reviews it or an explicit automated test proves the exact behavior.

| Feature | Version | Area | Status | Verification |
| --- | --- | --- | --- | --- |
| Build-version dashboard | V0.0 | Internal Ops | Retired | Linear is source of truth; `/admin/build` is a protected launch page |
| Agent board | V0.0 | Internal Ops | Retired | Agent lanes moved into Linear/issues and repo docs |
| Data model + RLS | V0.1 | Backend | Complete | Migrations, RLS checks, seed data, and production Supabase public env verified |
| Buyer account auth | V0.1 | Buyer | Working path | AWO-38; Supabase Auth REST signup/sign-in route and buyer profile bootstrap |
| Buyer order history | V0.2/V0.4 | Buyer | Working path | AWO-53; server verifies buyer access token before order attachment, account page reads buyer-owned orders through RLS |
| Buyer cart persistence | V0.2/V0.4 | Buyer | Working path | AWO-54; signed-in carts sync through Supabase `carts`/`cart_items`, guests keep browser fallback |
| Cart edit controls | V0.2/V1.0 | Buyer | Working path | Cart supports quantity update, remove item, and clear cart; covered by `npm run test:demo` |
| Shop browse | V0.2 | Buyer | Polished real-catalog path | AWO-51; local and production smoke tests; production reads five-card `published_cards` catalog with real AWO logo |
| Checkout/order draft | V0.2+ | Buyer | Complete | AWO-37; local and production API draft creation verified |
| Stripe test checkout | V0.6/V0.7 | Buyer/Ops | Complete | AWO-46; Stripe test payment and webhook verified, `AWO-DRAFT-F2EC02824E` moved to paid in Supabase |
| Stakeholder demo walkthrough | V1.0 | Demo | Working path | AWO-76; `/demo` guides the shop, checkout, reveal, and protected proof-layer review path with demo-safe credentials; guided checkout seeds Wildflower Notes and prefilled recipient context; demo reveal preloads seeded code/PIN |
| Honoree PIN reveal | V0.3 | Recipient | Demo-ready playback path | AWO-41/AWO-76; `/api/reveal/verify` validates code/PIN through `verify_honoree_reveal`, then `/reveal` presents recipient playback, sender message, evidence, custody, and honest ownership posture |
| Reveal credential lifecycle | V0.3/V0.6 | Recipient/Ops | Hardened state checks | AWO-47; blocked credential states are safe, invalid attempts lock credentials, successful reveals emit custody events |
| My People + Reminders | V0.4 | Buyer | Account-aware discovery path | AWO-39/AWO-80; signed-in buyers use Supabase `people` and `occasions`, guests use local fallback, and both People/Reminders link saved occasions back into card discovery; covered by `npm run test:demo` |
| Artist submission | V0.5 | Artist | Supabase-backed draft path | AWO-42; approved artist profiles load publicly and signed-in artist/admin drafts persist on `cards` |
| Catalog artwork assets | V0.6/V0.7 | Buyer | Managed demo assets | AWO-50/AWO-51; published demo catalog points to static card artwork under `/cards/*` with fallback rendering for missing images |
| Admin approvals/ops | V0.6 | Ops | Read-only lifecycle visibility | AWO-40/AWO-48; protected page reads catalog health, lifecycle queues, stuck states, and sensitive metrics when service role is configured |
| Admin session visibility | V0.6/V1.0 | Ops/Security | Working path | AWO-75; protected admin pages show temporary-password versus named-admin session mode and include a visible logout |
| Lifecycle model | V0.6 | Backend/Ops | Schema foundation | AWO-43/AWO-45; order, reveal, custody, and ownership model plus first schema layer before payment/fulfillment implementation |
| Ownership records | V0.6/V1.0 | Backend/Ops | Working path | AWO-71/AWO-72; paid items create pending ownership records, fulfilled items activate them, and `/admin/ownership` provides read-only operator visibility |
| Custody events | V0.6/V1.0 | Backend/Ops | Working path | AWO-73; `/admin/custody` provides read-only provenance event visibility for payment, credential, fulfillment, reveal, and ownership lifecycle evidence |
| Lifecycle reconciliation | V0.6/V1.0 | Backend/Ops | Working path | AWO-74; `/admin/reconciliation` flags mismatches between paid items, fulfillment, ownership records, and custody events |
| Visual QA | V0.7 | QA | Automated baseline | AWO-44/AWO-49/AWO-52; local desktop/mobile visual QA harness passes golden route sweep, mobile menu interaction, and mobile storefront density polish |
| Release readiness | V0.7/V1.0 | QA | Automated baseline | AWO-55/AWO-76; `npm run test:release` runs lint, mirror sync, build, smoke, guided demo journey, cart/account/nav dead-end and recovery checks, visual QA, and writes `.qa/release-readiness/latest.json` |
