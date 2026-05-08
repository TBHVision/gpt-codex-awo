# Deployment

## Goal

Use Vercel as the Tony review surface so dashboard and feature gates are not dependent on a local Windows dev server.

## Current Recommendation

Deploy from the repository root with default Next.js settings.

The dashboard app is mirrored at the repository root specifically to make Vercel deployment boring and avoid Root Directory confusion.

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

`apps/web` still contains the same app for the intended monorepo structure. For now, the root mirror is the production deployment path because it eliminates Vercel configuration ambiguity.
