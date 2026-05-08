# Deployment

## Goal

Use Vercel as the Tony review surface so dashboard and feature gates are not dependent on a local Windows dev server.

## Recommended Setup

GitHub repo:

`gpt-codex-awo`

Vercel project:

`gpt-codex-awo`

Vercel root directory:

`apps/web`

Build command:

`npm run build`

Install command:

`npm install`

Output:

Next.js default

## Environments

Preview deployments are for Tony gate review. Production is for approved milestone snapshots.

## Tony Action: GitHub

1. Sign into GitHub using the HatchVision/business identity.
2. Create a new private repo named `gpt-codex-awo`.
3. Do not initialize with README, `.gitignore`, or license.
4. Copy the repo URL.
5. Give Codex the repo URL so it can add it as `origin` and push.

## Tony Action: Vercel

1. Sign into Vercel using the HatchVision/business identity.
2. Import the `gpt-codex-awo` GitHub repo.
3. Set root directory to `apps/web`.
4. Deploy with the default Next.js settings.
5. Use the Vercel preview URL for human tests and gate reviews.

