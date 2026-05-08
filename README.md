# GPT-Codex AWO

This is the HatchVision-owned GPT-Codex implementation of AWO. It is intentionally separate from the Claude Code AWO project.

## Active Project Root

`C:\HatchVision\AWO\GPT-Codex`

## First Milestone

V0.0 Foundation + Build Dashboard

- Web app: `apps/web`
- Vercel-compatible app root: repository root
- Local build dashboard: `http://127.0.0.1:3000/admin/build`
- Stable review target: Vercel preview deployment after GitHub import
- Durable project memory: `docs/`
- Agent lane files: `agents/`

## Operating Rule

The local docs and build dashboard are the source of truth. Chat memory is helpful, but project state lives in versioned files.

## Deployment Direction

Localhost is for Codex development only. Tony review should happen on Vercel deployments so the dashboard stays reachable without a local Node server.

The Next app is also mirrored at the repository root so Vercel can deploy it with default settings. `apps/web` remains as the monorepo app folder until the repo structure is finalized.
