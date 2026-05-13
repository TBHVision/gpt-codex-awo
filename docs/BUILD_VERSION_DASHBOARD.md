# GPT-Codex AWO Project Tracking

Linear is now the source of truth for the GPT-Codex AWO build. The custom dashboard has been retired into a lightweight protected project homepage at `/admin/build`.

Linear project:

https://linear.app/hatchvision/project/gpt-codex-awo-build-7e22f4e31cd8

## Source Of Truth Rule

- Linear owns phase status, execution issues, parking lot items, dependencies, and gate decisions.
- Repo markdown files support implementation memory and should point back to Linear when status matters.
- The web page should not duplicate editable issue or phase tracking.
- The Next.js app lives at the repository root only. The old `apps/web` mirror
  has been retired to avoid duplicate edits and drift.

## Version Rollup

Do not edit phase percentages here. Linear milestones and gate issues are the
live version rollup. Use this file only to explain how the custom dashboard was
retired and where future agents should look.

## Current Phase

Linear is the live phase source of truth. Current active launch work is tracked
under AWO-63, the V1.0 launch-ready gate, with remaining external/Tony decisions
kept open as related issues such as AWO-79, AWO-82, and AWO-83.
