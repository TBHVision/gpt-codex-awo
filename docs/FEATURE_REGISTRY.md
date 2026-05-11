# Feature Registry

This registry is the GPT-Codex source of truth for feature status. A feature is not marked verified until Tony reviews it or an explicit automated test proves the exact behavior.

| Feature | Version | Area | Status | Verification |
| --- | --- | --- | --- | --- |
| Build-version dashboard | V0.0 | Internal Ops | Retired | Linear is source of truth; `/admin/build` is a protected launch page |
| Agent board | V0.0 | Internal Ops | Retired | Agent lanes moved into Linear/issues and repo docs |
| Data model + RLS | V0.1 | Backend | Complete | Migrations, RLS checks, seed data, and production Supabase public env verified |
| Buyer account auth | V0.1 | Buyer | Working path | AWO-38; Supabase Auth REST signup/sign-in route and buyer profile bootstrap |
| Shop browse | V0.2 | Buyer | Polished real-catalog path | AWO-51; local and production smoke tests; production reads five-card `published_cards` catalog with real AWO logo |
| Checkout/order draft | V0.2+ | Buyer | Complete | AWO-37; local and production API draft creation verified |
| Stripe test checkout | V0.6/V0.7 | Buyer/Ops | In progress | AWO-46; server-side test-mode session and webhook routes added, awaiting Stripe test keys/webhook verification |
| Honoree PIN reveal | V0.3 | Recipient | Supabase-backed demo record | AWO-41; `/api/reveal/verify` validates code/PIN through `verify_honoree_reveal` |
| Reveal credential lifecycle | V0.3/V0.6 | Recipient/Ops | Hardened state checks | AWO-47; blocked credential states are safe, invalid attempts lock credentials, successful reveals emit custody events |
| My People | V0.4 | Buyer | Account-aware path | AWO-39; signed-in buyers use Supabase `people` and `occasions`, guests use local fallback |
| Artist submission | V0.5 | Artist | Supabase-backed draft path | AWO-42; approved artist profiles load publicly and signed-in artist/admin drafts persist on `cards` |
| Catalog artwork assets | V0.6/V0.7 | Buyer | Managed demo assets | AWO-50/AWO-51; published demo catalog points to static card artwork under `/cards/*` with fallback rendering for missing images |
| Admin approvals/ops | V0.6 | Ops | Read-only lifecycle visibility | AWO-40/AWO-48; protected page reads catalog health, lifecycle queues, stuck states, and sensitive metrics when service role is configured |
| Lifecycle model | V0.6 | Backend/Ops | Schema foundation | AWO-43/AWO-45; order, reveal, custody, and ownership model plus first schema layer before payment/fulfillment implementation |
| Visual QA | V0.7 | QA | Automated baseline | AWO-44/AWO-49/AWO-52; local desktop/mobile visual QA harness passes golden route sweep, mobile menu interaction, and mobile storefront density polish |
