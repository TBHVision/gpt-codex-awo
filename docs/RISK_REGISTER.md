# Risk Register

| Risk | Level | Mitigation |
| --- | --- | --- |
| Personal/work account cross-pollination | Medium | Keep business-owned cloud services, repo, billing, env vars, and deploy targets separate. |
| Accidental Claude Code project changes | High | Work only in `GPT-Codex`; do not edit Claude project paths. |
| Secrets exposed in chat or browser code | High | Never paste secret values into chat; keep service role keys server-only. |
| RLS leaks or blocks core workflows | High | Add policy tests before production data. |
| Dashboard status drifts from reality | Medium | Gate reviews require evidence, not just manual status edits. |
| Agent file conflicts | Medium | Use agent ownership boundaries and integration gates. |

