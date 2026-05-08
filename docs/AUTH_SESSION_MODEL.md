# Auth Session Model

Linear issue: AWO-7

This document explains the current V0.1 admin access model and the intended Supabase-backed auth path.

## Current Temporary Admin Gate

The protected internal project homepage at `/admin/build` is guarded by a temporary app-level password gate.

This is intentionally simple. It exists to protect the internal dashboard while the real Supabase account model is being built.

Current flow:

1. User opens `/admin/build`.
2. `src/proxy.ts` checks the `awo_admin_session` cookie.
3. If the cookie is missing or wrong, the user is redirected to `/admin/login`.
4. The login page compares the submitted password to `AWO_ADMIN_PASSWORD`.
5. If the password matches, the app writes an HTTP-only `awo_admin_session` cookie.
6. `/admin/logout` deletes the cookie and redirects back to `/admin/login`.

Session details:

- Cookie name: `awo_admin_session`
- Cookie path: `/admin`
- Cookie lifetime: 8 hours
- Cookie flags: `httpOnly`, `sameSite=lax`, `secure` in production
- Search protection: `X-Robots-Tag: noindex, nofollow, noarchive`

## Current Environment Variables

Server-only:

- `AWO_ADMIN_PASSWORD`
- `AWO_ADMIN_SESSION_TOKEN`

`AWO_ADMIN_SESSION_TOKEN` should be a separate random value. If it is missing, the app currently falls back to `AWO_ADMIN_PASSWORD`, but production should define both.

These values are set in:

- Local developer shell or `.env.local`
- Vercel Project Settings -> Environment Variables

Never commit these values and never paste them into chat.

## Supabase Auth Direction

The future production auth model should use Supabase Auth for real users and sessions.

Expected user roles:

- `buyer`
- `artist`
- `admin`

Role is stored in `public.profiles.role`.

Supabase owns identity and session issuance. The app should use Supabase session helpers or server-side clients to check the current user and then rely on RLS for data access.

## Admin Bootstrap Path

The first admin account needs a deliberate bootstrap process.

Recommended V0.1 path:

1. Tony creates or invites the first HatchVision admin user through Supabase Auth.
2. Codex provides a versioned SQL migration or one-time documented SQL command to set that user profile role to `admin`.
3. The command targets the user by email or user ID.
4. The command is run through the Supabase CLI or dashboard SQL editor only after Tony confirms the target account.
5. Future admins are managed through an admin UI or a server-only admin action.

Important: do not let ordinary signup choose `admin`. User-facing signup should create `buyer` by default.

Template:

- `supabase/admin/bootstrap_admin_by_email.sql`

This template must be edited with the confirmed HatchVision admin email before it is run.

## What Gets Replaced Later

The temporary password gate should be replaced when Supabase Auth-backed admin sessions are ready.

Replace:

- `AWO_ADMIN_PASSWORD`
- `AWO_ADMIN_SESSION_TOKEN`
- `awo_admin_session` cookie
- `/admin/login` password form
- password comparison in `src/app/admin/login/page.tsx`
- cookie check in `src/proxy.ts`

Keep:

- `/admin/logout` route concept
- `/admin/*` route protection concept
- noindex protections for internal admin pages
- Linear as source of truth for project state
- RLS as the data access boundary

## Security Rules

- Service role keys are server-only.
- Browser-safe keys must start with `NEXT_PUBLIC_`.
- Admin role changes must happen through trusted server-side code, migrations, or a controlled Supabase CLI command.
- Product routes must not bypass RLS with service role unless they are explicitly server-only workflows.
- Honoree reveal access stays server-mediated until a narrow PIN-verification RPC/API is implemented.
