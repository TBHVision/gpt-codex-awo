# Auth Session Model

Linear issue: AWO-7

This document explains the current V0.1 admin access model and the intended Supabase-backed auth path.

## Current Temporary Admin Gate

The protected internal admin routes are guarded by an app-level admin session
cookie. The login page supports two paths:

- Supabase Auth email/password for users whose `profiles.role` is `admin`.
- Temporary HatchVision dashboard password fallback through `AWO_ADMIN_PASSWORD`.

The temporary password fallback stays available while Tony creates or confirms
named admin users. Supabase access tokens are used only during login verification
and are not stored in browser-visible admin pages.

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

The production auth model should use Supabase Auth for real users and sessions.

Expected user roles:

- `buyer`
- `artist`
- `admin`

Role is stored in `public.profiles.role`.

Supabase owns identity and session issuance. The app should use Supabase session helpers or server-side clients to check the current user and then rely on RLS for data access.

## Buyer Account Path

AWO-38 adds `/account` as the first buyer-facing Supabase Auth path.

Current buyer flow:

1. Buyer opens `/account`.
2. Buyer signs up or signs in with email and password through Supabase Auth REST endpoints.
3. Supabase returns a buyer session when the account is allowed to sign in.
4. The browser stores the session temporarily in `localStorage` under `awo_buyer_session`.
5. The page uses the access token to read the buyer's own `public.profiles` row through RLS.

Anonymous browsing, card detail pages, cart, and checkout draft creation still work without a buyer account. When a buyer is signed in, checkout sends the Supabase access token to the server, the server verifies it with Supabase Auth, and the created order is attached to that buyer profile without exposing the service role key to the browser.

New auth users are bootstrapped as buyers by:

- `supabase/migrations/20260511071000_buyer_auth_profile_bootstrap.sql`
- function `public.create_buyer_profile_for_auth_user()`
- trigger `create_buyer_profile_after_auth_signup` on `auth.users`

Current account-backed paths:

- Buyer profile reads through Supabase Auth and RLS.
- People and Reminders read/write through buyer-owned Supabase tables with local guest fallback.
- Signed-in buyer carts sync to `carts` and `cart_items` while guest carts stay browser-local.
- Signed-in checkout drafts can attach orders to the buyer profile, and order history reads through RLS.

Current limits:

- Buyer sessions are stored client-side for now, not in server-side Supabase cookies.
- Existing anonymous carts or draft orders do not retroactively attach to a buyer.
- Email confirmation behavior is controlled by Supabase Auth settings.
- Social login providers are not configured yet.

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

The temporary password fallback should be removed after named Supabase admin
users and audit-backed admin actions are fully ready.

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
