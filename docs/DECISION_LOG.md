# Decision Log

## 2026-05-08: Keep GPT-Codex Separate From Claude Code

Decision: Build a separate GPT-Codex AWO instance with its own folder, repo, backend tenant, deploy target, and environment variables.

Why: Prevent cross-pollination with the existing Claude Code AWO project and protect production data.

Status: Accepted

## 2026-05-08: Move Active Project Out Of OneDrive

Decision: Use `C:\HatchVision\AWO\GPT-Codex` as the active code path.

Why: OneDrive caused permission locks on generated Next.js files. Active code should live in a normal local development folder, with OneDrive backup handled separately.

Status: Accepted

## 2026-05-08: Build Dashboard First

Decision: Make `/admin/build` the first real product surface.

Why: Tony needs phase visibility, gate reviews, agent lanes, dependencies, tests, blockers, and future scope before the full product build accelerates.

Status: Accepted

## 2026-05-08: Use Local Docs As Durable Memory

Decision: Maintain project truth in local Markdown files and structured dashboard data.

Why: Long-running work cannot depend on chat context alone.

Status: Accepted

## 2026-05-08: Use Vercel Preview For Tony Review

Decision: Use localhost only for active Codex development and use Vercel preview deployments as the stable human review surface.

Why: Local Windows dev servers are fragile because they depend on a terminal process staying alive. Tony gate reviews need a stable URL.

Status: Accepted
