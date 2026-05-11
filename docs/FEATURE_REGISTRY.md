# Feature Registry

This registry is the GPT-Codex source of truth for feature status. A feature is not marked verified until Tony reviews it or an explicit automated test proves the exact behavior.

| Feature | Version | Area | Status | Verification |
| --- | --- | --- | --- | --- |
| Build-version dashboard | V0.0 | Internal Ops | Retired | Linear is source of truth; `/admin/build` is a protected launch page |
| Agent board | V0.0 | Internal Ops | Retired | Agent lanes moved into Linear/issues and repo docs |
| Data model + RLS | V0.1 | Backend | Complete | Migrations, RLS checks, seed data, and production Supabase public env verified |
| Shop browse | V0.2 | Buyer | Working shell + real catalog | Local and production smoke tests; production reads `published_cards` |
| Checkout/order draft | V0.2+ | Buyer | Next | AWO-37 |
| Honoree PIN reveal | V0.3 | Recipient | Demo shell | AWO-41 |
| My People | V0.4 | Buyer | Local demo shell | AWO-39 |
| Artist submission | V0.5 | Artist | Local demo shell | AWO-42 |
| Admin approvals/ops | V0.6 | Ops | Protected shell | AWO-40 |
| Visual QA | V0.7 | QA | Planned | AWO-44 |
