# QA And Release Runbook

This runbook is the repeatable proof loop for the GPT-Codex AWO app. Linear is
the source of truth for phase status, issue ownership, blockers, and gate
decisions. This repo contains the code, docs, and local verification evidence.

## Current Source Of Truth

- Linear project: GPT-Codex AWO Build
- GitHub repo: `https://github.com/TBHVision/gpt-codex-awo`
- Local workspace: `C:\HatchVision\AWO\GPT-Codex`
- Local app: `http://127.0.0.1:3000`
- Vercel app: `https://gpt-codex-awo-dashboard.vercel.app`

## Standard Local Verification

Run these from the repo root:

```powershell
npm run lint
npm run build
npm run test:smoke
npm run test:release
```

What each command proves:

- `npm run lint`: TypeScript/React/Next lint rules are clean.
- `npm run build`: production Next.js build succeeds.
- `npm run test:smoke`: key public routes respond and protected admin routes
  redirect to login when unauthenticated.
- `npm run test:release`: runs the full local gate: lint, build, fresh
  production server, smoke routes, and desktop/mobile visual QA.

For local release testing of authenticated admin screenshots, set temporary
process-only admin values before running the release gate:

```powershell
$env:AWO_ADMIN_PASSWORD="test"
$env:AWO_ADMIN_SESSION_TOKEN="test"
npm run test:release
```

Do not commit local secret values. Vercel production uses real dashboard
secrets stored in Project Settings.

## Smoke Test Coverage

The smoke script checks these public routes return HTTP 200:

- `/shop`
- `/artists`
- `/people`
- `/reminders`
- `/reveal`
- `/studio`
- `/cart`
- `/checkout`

It also checks these protected routes redirect to `/admin/login` without an
admin session cookie:

- `/admin/build`
- `/admin/ops`
- `/admin/launch`
- `/admin/reviews`
- `/admin/audit`
- `/admin/fulfillment`

The smoke test assumes the local server is running at `http://127.0.0.1:3000`.
Use another target with:

```powershell
$env:SMOKE_BASE_URL="https://your-preview-url.vercel.app"
npm run test:smoke
```

## Local Server

Start the local server after a successful build:

```powershell
npm run start -- --hostname 0.0.0.0 --port 3000
```

If the hidden server is stale, restart it before browser verification.

## Admin Protection

Admin routes are protected by the existing app-level password gate:

- `/admin/build`
- `/admin/ops`
- `/admin/launch`
- `/admin/reviews`
- `/admin/audit`
- `/admin/fulfillment`

For local manual admin testing, `AWO_ADMIN_PASSWORD` and
`AWO_ADMIN_SESSION_TOKEN` must be available to the running Next process. Tony
previously used a temporary local password of `test`; production should use a
real secret in Vercel.

Temporary password sessions are intentionally read-only for write-capable admin
flows. Card review and fulfillment transitions require a Supabase-backed named
admin login so audit events can identify the actor.

## Vercel Supabase Public Env

AWO-18 is closed. Vercel has the browser-safe Supabase public variables set for
the deployed shop:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not use a Supabase service-role key in Vercel public variables.

After setting or changing Vercel env vars in the future:

1. Redeploy the Vercel project.
2. Open `/shop` on the Vercel domain.
3. Confirm seeded demo cards load.
4. Run the smoke test against the Vercel URL if access policy allows it.
5. Update the active Linear issue with evidence.

## Release Evidence Pattern

For each Linear issue, add a closing comment with:

- Commit hash and message.
- Routes changed or added.
- Browser verification summary.
- `npm run lint` result.
- `npm run build` result.
- `npm run test:smoke` result when relevant.
- `npm run test:release` result for gate reviews and launch-impacting changes.
- Any external verification result, such as Stripe webhook delivery or Supabase
  lifecycle state.

Then move the issue to Done.

## Do Not Drift

Do not maintain a parallel custom status dashboard as the primary tracker.
Linear owns status. The protected project home should stay a lightweight launch
point, not a second planning system.
