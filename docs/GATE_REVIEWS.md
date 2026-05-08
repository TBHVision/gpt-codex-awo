# Gate Reviews

## V0.0 Foundation + Build Dashboard

Status: Approved

Required before close:

- [x] Local web app runs.
- [x] `/admin/build` dashboard renders.
- [x] Dashboard shows versions, agents, tests, blockers, and gate status.
- [x] Docs exist for risks, environments, secrets, tests, and future scope.
- [x] Tony confirms this is understandable and useful.

Decision: Approved. V0.1 is active.

Ownership:

- Codex Tests are verified by Codex/tooling.
- Human Tests are verified by Tony.

## V0.1 Security + Data/Auth

Status: In progress

Required before close:

- [x] Dashboard requires admin authentication.
- [x] Login route accepts the configured admin password.
- [x] Logout route clears the admin session.
- [ ] Vercel production has `AWO_ADMIN_PASSWORD` configured.
- [ ] Vercel production has `AWO_ADMIN_SESSION_TOKEN` configured.
- [ ] HatchVision-owned Supabase project exists.
- [ ] Schema migrations are created.
- [ ] RLS policies are created and tested.
- [ ] Auth session model is documented.
- [ ] Admin bootstrap path exists.
- [ ] Seed data plan exists.

Decision: Open

Ownership:

- Codex owns implementation, build checks, and evidence.
- Tony owns external account setup and human login review.
