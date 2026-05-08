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

## 2026-05-08: Prevent Search Indexing

Decision: Add noindex protections to the Vercel-hosted dashboard before using it as an internal review surface.

Why: The V0.0 dashboard is public by URL until authentication is added. Search engines should be explicitly instructed not to crawl or index it.

Status: Accepted

## 2026-05-08: Remove Fake Usage Meter

Decision: Remove the top gas-tank usage card and redundant current-gate card from the dashboard.

Why: The gas tank was not connected to real OpenAI usage or billing data, and current gate duplicated the version phase table.

Status: Accepted

## 2026-05-08: Require Typed Gate Approval

Decision: V0.0 gate submission opens a confirmation dialog and requires typing `V0.0` before approving the phase.

Why: Phase transitions should be intentional. The dashboard should not move to V0.1 from an accidental click.

Status: Accepted

## 2026-05-08: Start V0.1 With Admin Password Gate

Decision: Protect `/admin/*` with a temporary app-level password gate before adding Supabase-backed accounts.

Why: The dashboard needs immediate protection on Vercel, while Supabase tenant creation and RLS design are separate V0.1 work items.

Status: Accepted

## 2026-05-08: Move Project Tracking To Linear

Decision: Linear is the source of truth for project phases, issues, parking lot items, dependencies, and gate reviews. The custom dashboard becomes a lightweight protected project homepage.

Why: Linear is a mature professional tool that future engineers will understand. Keeping both Linear and a custom editable dashboard would create drift and false confidence.

Status: Accepted

## 2026-05-08: Start Clean Supabase Tenant

Decision: Use the new HatchVision-owned Supabase project as the GPT-Codex AWO backend foundation. Treat Claude Code Supabase work as reference only.

Why: A clean tenant avoids inherited half-finished schema, hidden policies, stale test data, and cross-project drift.

Status: Accepted
