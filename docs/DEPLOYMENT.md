# Deployment

## Goal

Use Vercel as the Tony review surface so dashboard and feature gates are not dependent on a local Windows dev server.

## Current Recommendation

Deploy from the repository root. The repo includes root-level scripts and `vercel.json` that point Vercel to the app in `apps/web`.

GitHub repo:

`gpt-codex-awo`

Vercel project:

`gpt-codex-awo`

Vercel root directory:

Repository root

Install command:

`npm --prefix apps/web install`

Build command:

`npm --prefix apps/web run build`

Output directory:

`apps/web/.next`

## Why This Setup

The web app lives in `apps/web`, but the project also has root-level docs, agent files, and future backend packages. Deploying from the repository root with explicit commands makes the Vercel setup easier to reason about and avoids `apps/web/apps/web` mistakes.

## Vercel Settings

1. Open the `gpt-codex-awo` Vercel project.
2. Go to Settings.
3. Go to Build and Deployment.
4. Set Root Directory to the repository root. If Vercel shows a field value of `apps/web`, clear it.
5. Ensure Install Command is `npm --prefix apps/web install`.
6. Ensure Build Command is `npm --prefix apps/web run build`.
7. Ensure Output Directory is `apps/web/.next`.
8. Save.
9. Redeploy the latest `main` commit.

## Troubleshooting

If Vercel says `cd apps/web: No such file or directory`, then commands are being run from inside `apps/web` already. Use either repo root with explicit `npm --prefix apps/web ...` commands, or `apps/web` root with plain `npm install` and `npm run build`. Do not mix both.

If the production URL shows `404: NOT_FOUND`, verify that the production domain is assigned to the latest successful deployment and open `/admin/build`.

