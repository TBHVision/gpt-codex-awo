# GPT-Codex AWO Project Tracking

Linear is now the source of truth for the GPT-Codex AWO build. The custom dashboard has been retired into a lightweight protected project homepage at `/admin/build`.

Linear project:

https://linear.app/hatchvision/project/gpt-codex-awo-build-7e22f4e31cd8

## Source Of Truth Rule

- Linear owns phase status, execution issues, parking lot items, dependencies, and gate decisions.
- Repo markdown files support implementation memory and should point back to Linear when status matters.
- The web page should not duplicate editable issue or phase tracking.

## Version Rollup

| Version | Name | Status | Codex Tests | Human Tests | Gate |
| --- | --- | --- | --- | --- | --- |
| V0.0 | Foundation + Build Dashboard | Complete | 5/5 | 3/3 | Approved |
| V0.1 | Security + Data/Auth | In Progress | 3/9 | 0/5 | Open |
| V0.2 | Public Shop | Planned | 0/10 | 0/5 | Locked |
| V0.3 | Honoree Reveal | Planned | 0/8 | 0/5 | Locked |
| V0.4 | My People + Buyer Tools | Planned | 0/12 | 0/6 | Locked |
| V0.5 | Artist Studio | Planned | 0/9 | 0/5 | Locked |
| V0.6 | Admin + Ops | Planned | 0/14 | 0/7 | Locked |
| V0.7 | QA + Observability | Planned | 0/16 | 0/4 | Locked |
| V1.0 | Launch-Ready Instance | Planned | 0/20 | 0/10 | Locked |

## Current Phase

V0.1 is active. The first security deliverable is an app-level admin password gate for `/admin/*`.
