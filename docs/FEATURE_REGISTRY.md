# Feature Registry

This registry is the GPT-Codex source of truth for feature status. A feature is not marked verified until Tony reviews it or an explicit automated test proves the exact behavior.

| Feature | Version | Area | Status | Verification |
| --- | --- | --- | --- | --- |
| Build-version dashboard | V0.0 | Internal Ops | Retired | Linear is source of truth; `/admin/build` is a protected launch page |
| Agent board | V0.0 | Internal Ops | Retired | Agent lanes moved into Linear/issues and repo docs |
| Data model + RLS | V0.1 | Backend | Complete | Migrations, RLS checks, seed data, and production Supabase public env verified |
| Buyer account auth | V0.1 | Buyer | Working path | AWO-38; Supabase Auth REST signup/sign-in route and buyer profile bootstrap |
| Shop browse | V0.2 | Buyer | Working shell + real catalog | Local and production smoke tests; production reads `published_cards` |
| Checkout/order draft | V0.2+ | Buyer | Complete | AWO-37; local and production API draft creation verified |
| Honoree PIN reveal | V0.3 | Recipient | Demo shell | AWO-41 |
| My People | V0.4 | Buyer | Account-aware path | AWO-39; signed-in buyers use Supabase `people` and `occasions`, guests use local fallback |
| Artist submission | V0.5 | Artist | Local demo shell | AWO-42 |
| Admin approvals/ops | V0.6 | Ops | Read-only ops visibility | AWO-40; protected page reads catalog health now and sensitive metrics when service role is configured |
| Visual QA | V0.7 | QA | Planned | AWO-44 |
