# Deployment

## Goal

Use Vercel as the Tony review surface so dashboard and feature gates are not dependent on a local Windows dev server.

## Current Recommendation

Use Vercel's native monorepo setup. The Next.js app lives in `apps/web`, so Vercel should use `apps/web` as the Root Directory and then run normal app-level npm commands from there.

GitHub repo:

`gpt-codex-awo`

Vercel project:

`gpt-codex-awo`

Vercel root directory:

`apps/web`

Install command:

`npm install`

Build command:

`npm run build`

Output directory:

Leave blank / default

## Why This Setup

The web app lives in `apps/web`. Vercel can deploy monorepos cleanly when Root Directory is set to the app folder. Once that is set, install and build commands should be plain app-level commands.

## Vercel Settings

1. Open the `gpt-codex-awo` Vercel project.
2. Go to Settings.
3. Go to Build and Deployment.
4. Set Root Directory to `apps/web`.
5. Ensure Install Command is `npm install`.
6. Ensure Build Command is `npm run build`.
7. Leave Output Directory blank/default.
8. Save.
9. Redeploy the latest `main` commit.

## Troubleshooting

If Vercel says `cd apps/web: No such file or directory`, then commands are being run from inside `apps/web` already. Use plain `npm install` and `npm run build`.

If the production URL shows `404: NOT_FOUND`, verify that the production domain is assigned to the latest successful deployment and open `/admin/build`.
