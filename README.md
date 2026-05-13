# GPT-Codex AWO

This is the HatchVision-owned GPT-Codex implementation of AWO. It is intentionally separate from the Claude Code AWO project.

## Active Project Root

`C:\HatchVision\AWO\GPT-Codex`

## First Milestone

V0.0 Foundation + Build Dashboard

- Web app: repository root
- Vercel-compatible app root: repository root
- Local build dashboard: `http://127.0.0.1:3000/admin/build`
- Stable review target: Vercel preview deployment after GitHub import
- Durable project memory: `docs/`
- Agent lane files: `agents/`

## Operating Rule

Linear is the source of truth for project status. Repo docs support implementation memory, and chat memory is helpful, but status decisions should point back to Linear.

## Deployment Direction

Localhost is for Codex development. Tony review can happen locally through the Codex browser or on Vercel deployments when external services such as Stripe webhooks need the hosted URL.

The Next.js app now lives only at the repository root. The old `apps/web` mirror was a temporary Vercel workaround and has been retired so future edits happen once.
