# Overnight Work Queue

Last updated: 2026-05-12

This is the autonomous work queue for long Codex runs. Linear remains the source
of truth; this file is the repo-local execution checklist so Codex can keep
moving without waking Tony for every small branch decision.

## Keep Going Unless Blocked By External Setup

1. Harden the stakeholder demo path.
   - Keep `/demo` and `/reveal?code=AWO-DEMO-001&demo=1` deterministic.
   - Verify demo checkout, reveal playback, cart controls, account recovery, and
     core navigation in `npm run test:demo`.
2. Keep launch evidence current.
   - Refresh `docs/GATE_EVIDENCE.md`, `docs/TONY_REVIEW_BATCH.md`, and
     `docs/PRODUCTION_GAP_AUDIT.md` after launch-critical changes.
   - Keep Linear comments tied to commit hashes, release runs, and routes.
3. Remove demo dead ends before adding new feature breadth.
   - Prefer fixing broken links, confusing empty states, and stale-session
     recovery over expanding the surface area.
4. Improve read-only production confidence.
   - Add no-secret health/readiness surfaces.
   - Add QA coverage before UI polish whenever a workflow can regress.
5. Leave V1.0 open until human gates are accepted.
   - Do not mark phases Done just because automated evidence is green.
   - Keep live Stripe charges, destructive admin actions, and paid observability
     setup out of scope unless Tony explicitly approves them.

## Current Morning Review Queue

- Review `/demo`.
- Review `/reveal?code=AWO-DEMO-001&demo=1`.
- Review `/admin/launch`.
- Review `/api/health` on Vercel after redeploy.
- Review Linear AWO-76 and AWO-63 evidence comments.

## Stop Conditions

Stop and ask Tony only when the next step requires one of these:

- A paid service decision or subscription change.
- A secret, token, webhook, DNS, or external dashboard setting.
- A live payment, refund, ownership transfer, or destructive admin action.
- A subjective launch decision that cannot be honestly automated.
