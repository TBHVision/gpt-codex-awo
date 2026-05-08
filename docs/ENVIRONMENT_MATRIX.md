# Environment Matrix

| Environment | Supabase | Vercel | Purpose |
| --- | --- | --- | --- |
| Local | HatchVision GPT-Codex AWO project | localhost | Build and debug |
| Preview | HatchVision GPT-Codex AWO project | Vercel preview | Review branches safely |
| Production | HatchVision GPT-Codex AWO project | Vercel production | Launch-ready demo |

Do not point GPT-Codex at the Claude Code Supabase project or Vercel project.

## Required Supabase Variables

Browser-safe:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `AWO_ADMIN_PASSWORD`
- `AWO_ADMIN_SESSION_TOKEN`

## Ownership

Tony owns production secret creation and rotation in Supabase and Vercel.

Codex owns documenting variable names, keeping secrets out of git, and wiring code to read them safely.
