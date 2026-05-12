# Needs Tony

The batched review/setup list lives in `docs/TONY_REVIEW_BATCH.md`.

Current action:

- Review `/demo` and `/reveal?code=AWO-DEMO-001&demo=1` for the V1.0
  stakeholder walkthrough and honoree playback pass.
- Review `/api/health` on Vercel after deploy; it should show readiness/service
  posture without revealing secrets.
- Review Linear gate issues AWO-57 through AWO-60. Codex has attached evidence;
  they should not be moved to Done until Tony confirms the human checks.
- Review `/admin/ops` when convenient and decide whether the read-only admin ops
  model is trustworthy enough to close the V0.6 gate.
- Review Linear issue AWO-61 for the V0.6 Admin + Ops gate evidence.
- Review Linear issue AWO-62 for the V0.7 QA + Observability gate evidence.
- Review Linear issue AWO-76 for the demo walkthrough/honoree playback evidence.

Upcoming Tony actions:

- Choose whether to add Sentry, PostHog, Vercel Web Analytics, and Vercel Speed
  Insights now or defer them until closer to launch.
- Perform final V1.0 launch review after remaining gate issues are either Done
  or intentionally deferred.

Do not paste secrets into chat. When credentials are needed, add them directly to local `.env.local` or the relevant service dashboard.
