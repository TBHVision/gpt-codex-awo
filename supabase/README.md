# Supabase

This folder contains the versioned database foundation for the HatchVision-owned GPT-Codex AWO Supabase project.

## Project Rule

Use a clean GPT-Codex Supabase project. Do not point this app at the Claude Code Supabase project.

## Migration Order

1. `migrations/20260508232000_initial_schema.sql`

## CLI

The Supabase CLI is installed as a project dev dependency. Run it through npm/npx from the repo root:

```powershell
npx supabase --version
npm run supabase -- --help
```

## Applying Migrations

Preferred path once Tony provides the project ref and authenticates locally:

```powershell
npm run db:link -- --project-ref <project-ref>
npm run db:push
```

Do not paste the database password, access token, or service role key into chat.

## Security Note

RLS policies are intentionally handled in AWO-6. The initial migration enables RLS on application tables, but policy tests must pass before product features rely on this database.
