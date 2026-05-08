# Secrets Policy

- Never paste API keys, service role keys, auth tokens, passwords, or private credentials into chat.
- `.env.local` is local only and must not be committed.
- `.env.example` lists variable names only.
- Supabase service role keys are server-only.
- Browser-visible variables must start with `NEXT_PUBLIC_` and must be safe to expose.
- If a secret is exposed, rotate it at the service that issued it.

