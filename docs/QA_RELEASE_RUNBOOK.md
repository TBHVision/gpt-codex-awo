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
npm run test:mirror
npm run build
npm run test:smoke
npm run test:demo
npm run test:release
```

What each command proves:

- `npm run lint`: TypeScript/React/Next lint rules are clean.
- `npm run test:mirror`: root deployment files and `apps/web` files match.
- `npm run build`: production Next.js build succeeds.
- `npm run test:smoke`: key public routes respond and protected admin routes
  redirect to login when unauthenticated. It also validates the no-secret
  `/api/health` payload shape, including deployment metadata and service
  posture booleans.
- `npm run test:vercel:smoke`: runs the same route checks against production
  Vercel and verifies `/api/health` is serving the local Git `HEAD` commit.
- `npm run test:demo`: launches Chrome, clicks `/demo` Start Guided Checkout,
  verifies the prefilled checkout story, cart item, and total, then checks the
  seeded honoree playback path at `/reveal?code=AWO-DEMO-001&demo=1`.
- `npm run test:credentials`: safely verifies the remote credential-generation
  RPC exists and rejects calls without a named admin actor. It does not generate
  or mutate a credential.
  It verifies the Supabase-backed reveal API when environment variables are
  present, checks demo playback content, and also verifies cart quantity/remove
  controls, malformed cart-storage recovery, stale buyer-session recovery, and
  core storefront navigation routes.
- `npm run test:release`: runs the full local gate: lint, mirror sync, build, fresh
  production server, smoke routes, guided demo journey, and desktop/mobile
  visual QA.

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

- `/`
- `/shop`
- `/demo`
- `/artists`
- `/people`
- `/reminders`
- `/reveal`
- `/studio`
- `/cart`
- `/checkout`
- `/api/health`

It also checks these protected routes redirect to `/admin/login` without an
admin session cookie:

- `/admin/build`
- `/admin/ops`
- `/admin/launch`
- `/admin/reviews`
- `/admin/audit`
- `/admin/fulfillment`
- `/admin/ownership`
- `/admin/custody`
- `/admin/reconciliation`

The smoke test assumes the local server is running at `http://127.0.0.1:3000`.
Use another target with:

```powershell
$env:SMOKE_BASE_URL="https://your-preview-url.vercel.app"
npm run test:smoke
```

For the current Vercel production deployment, use:

```powershell
npm run test:vercel:smoke
```

## Demo Journey Coverage

The demo journey script proves the stakeholder walkthrough is not just a set of
static pages. It opens `/demo`, clicks `Start Guided Checkout`, and verifies
that `/checkout?demo=1` has:

- `Wildflower Notes` in the cart summary.
- `Demo Recipient` as the recipient.
- `Birthday` as the occasion.
- The guided sender message in the message notes field.
- `$5.50` as the order total.

Before clicking through, it also verifies the demo journey cards point to
deterministic demo-safe destinations:

- `Open shop` -> `/shop`
- `Open checkout` -> `/checkout?demo=1`
- `Open reveal` -> `/reveal?code=AWO-DEMO-001&demo=1`
- `Open reconciliation` -> `/admin/reconciliation`

It also opens the demo reveal link, verifies the seeded reveal code and PIN are
available for stakeholder walkthroughs, unlocks the demo playback, and confirms
the recipient-facing proof story renders:

- Reveal unlocked.
- Wildflower Notes.
- Sender message.
- Chain of custody.
- Reveal record.
- Evidence.
- Demo-safe proof layer.
- Operator proof links.

When Supabase public environment variables are available, the script also calls
`/api/reveal/verify` with `AWO-DEMO-001` and PIN `1234`. In CI environments
without those variables, that live API assertion is skipped with an explicit
`SKIP` line while the rendered playback checks still run.

Finally, it seeds a local cart item, confirms quantity can be increased,
confirms Remove empties the cart, and confirms malformed browser cart storage
recovers to the empty-cart state instead of crashing the page.

It also verifies `/account` recovers from a malformed saved buyer session and
checks the core storefront routes render expected page markers instead of 404,
`NOT_FOUND`, or generic page-load failures.

Use another target with:

```powershell
$env:AWO_QA_BASE_URL="https://your-preview-url.vercel.app"
npm run test:demo
```

For the current Vercel production deployment, use:

```powershell
npm run test:vercel:demo
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
- `/admin/ownership`
- `/admin/custody`
- `/admin/reconciliation`

For local manual admin testing, `AWO_ADMIN_PASSWORD` and
`AWO_ADMIN_SESSION_TOKEN` must be available to the running Next process. Tony
previously used a temporary local password of `test`; production should use a
real secret in Vercel.

Temporary password sessions are intentionally read-only for write-capable admin
flows. Card review and fulfillment transitions require a Supabase-backed named
admin login so audit events can identify the actor.

Protected admin pages show the active session mode near the top of the page:

- `Temporary password session` means the browser passed the temporary dashboard
  password gate and write actions should remain disabled.
- `Named admin session` means the browser passed Supabase admin login and
  eligible audited write controls may be enabled.

Use the visible `Log out` action in the session badge to clear the current admin
cookie before testing login behavior.

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
