# Deployment

## Goal

Use Vercel as the Tony review surface so dashboard and feature gates are not dependent on a local Windows dev server.

## Current Recommendation

Deploy from the repository root with default Next.js settings.

The Next.js app lives at the repository root specifically to make Vercel deployment boring and avoid Root Directory confusion.

## Vercel Settings

Set these project values:

- Framework Preset: `Next.js`
- Root Directory: repository root / blank
- Install Command: default or `npm install`
- Build Command: default or `npm run build`
- Output Directory: default / blank

## Review URL

Use:

`https://gpt-codex-awo.vercel.app/admin/build`

## Note

The old `apps/web` mirror has been retired. Use the repository root for local development, CI, and Vercel production deployment.
