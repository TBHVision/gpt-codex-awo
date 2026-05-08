# Supabase

This folder contains the versioned database foundation for the HatchVision-owned GPT-Codex AWO Supabase project.

## Project Rule

Use a clean GPT-Codex Supabase project. Do not point this app at the Claude Code Supabase project.

## Migration Order

1. `migrations/20260508232000_initial_schema.sql`

## Applying Migrations

Preferred path once the Supabase CLI is configured:

```powershell
supabase link --project-ref <project-ref>
supabase db push
```

Do not paste the database password, access token, or service role key into chat.
