# GPT-Codex AWO Build-Version Dashboard

This dashboard is the operating control tower for the GPT-Codex AWO build. It tracks version phases, agent lanes, dependencies, tests, gate reviews, blockers, and Tony review points.

## Gas Tank

Status: Green

Guidance: Pro 5x is the right starting tier. Move toward Pro 20x only if long-running parallel agent work repeatedly hits usage limits or slows delivery.

## Version Rollup

| Version | Name | Status | Self Tests | Human Tests | Gate |
| --- | --- | --- | --- | --- | --- |
| V0.0 | Foundation + Build Dashboard | In Review | 3/5 | 0/3 | Open |
| V0.1 | Data Model + Auth | Planned | 0/8 | 0/4 | Locked |
| V0.2 | Public Shop | Planned | 0/10 | 0/5 | Locked |
| V0.3 | Honoree Reveal | Planned | 0/8 | 0/5 | Locked |
| V0.4 | My People + Buyer Tools | Planned | 0/12 | 0/6 | Locked |
| V0.5 | Artist Studio | Planned | 0/9 | 0/5 | Locked |
| V0.6 | Admin + Ops | Planned | 0/14 | 0/7 | Locked |
| V0.7 | QA + Observability | Planned | 0/16 | 0/4 | Locked |
| V1.0 | Launch-Ready Instance | Planned | 0/20 | 0/10 | Locked |

## Current Gate

V0.0 is ready for gate review. The gate can close only after all self-test boxes and human-test boxes are checked in the web dashboard.
