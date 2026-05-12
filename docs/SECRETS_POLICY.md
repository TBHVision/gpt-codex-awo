# Secrets Policy

- Never paste API keys, service role keys, auth tokens, passwords, or private credentials into chat.
- `.env.local` is local only and must not be committed.
- `.env.example` lists variable names only.
- Supabase service role keys are server-only.
- Browser-visible variables must start with `NEXT_PUBLIC_` and must be safe to expose.
- If a secret is exposed, rotate it at the service that issued it.

## Current Server-Only Secrets

- `AWO_ADMIN_PASSWORD`
- `AWO_ADMIN_SESSION_TOKEN`
- `AWO_DISABLE_TEMP_ADMIN_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`

## Browser-Safe Supabase Values

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The anon key is intentionally browser-visible, but RLS must protect the data behind it.
