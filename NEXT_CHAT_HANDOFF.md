# NEXT CHAT HANDOFF - GPT-Codex AWO

Last updated: 2026-05-18

Use this file to start a fresh Codex chat without loading the long prior thread.

## Why Start Fresh

The previous chat became very long and sluggish. That is expected: long chats
force the model/app to carry more context, more browser state, and more tool
history. For active coding, use short focused chats and keep durable state in
repo files, Linear, and commits.

## Project Root

Use:

```powershell
cd C:\HatchVision\AWO\GPT-Codex
```

This is the active single-root Next.js app. The old `apps/web` mirror was
retired. Do not recreate it.

## Current Source Of Truth

- GitHub repo: `https://github.com/TBHVision/gpt-codex-awo`
- Linear project: `GPT-Codex AWO Build`
- Repo docs: `docs/`
- Current context docs:
  - `docs/CURRENT_CONTEXT.md`
  - `docs/PRODUCTION_GAP_AUDIT.md`
  - `docs/GATE_EVIDENCE.md`
  - `docs/QA_RELEASE_RUNBOOK.md`

Linear owns phase/issue status. The old custom editable dashboard is retired as
a source of truth.

## Latest Important Commits

```text
c82c7e9 fix: constrain proof preview as video player
4aa84f3 fix: use media proof preview for coastal card
9ff2284 feat: add synced provenance preview
62e6a97 chore: retire apps web mirror
399dcf1 fix: harden admin session and rpc access
```

## Current State

The public shopper flow exists but still needs focused review/polish. The
storefront has product pages, cart, checkout draft/order flows, buyer account,
people/reminders, reveal surfaces, artist/studio/admin surfaces, Supabase-backed
catalog/data, Stripe test-mode plumbing, and lifecycle/admin evidence screens.

The current live discussion is about the Coastal Morning product detail page and
the provenance proof preview. The current page is:

```text
http://127.0.0.1:3010/shop/coastal-morning
```

The current proof preview is a transitional MP4 generated from a still proof
frame. It is not the final hand-painting animation. Tony wants a realistic hand
moving as if painting the card, not a pan/zoom effect.

Current proof assets:

```text
public/provenance/coastal-morning-proof-frame.png
public/provenance/coastal-morning-proof-preview.mp4
public/provenance/references/coastal-morning-runway-reference-v1.png
```

Note: `public/provenance/references/coastal-morning-runway-reference-v1.png`
may be uncommitted. It was cropped from the approved Concept B proof frame as a
Runway reference candidate.

## Current Open Problem

Need a real 6-second hand-painting animation for the shopper provenance preview.
The right path is:

1. Use Runway or another image-to-video service to generate one realistic visual
   video of the hand painting.
2. Derive matching TOF and thermal versions from that same master video so the
   three panels stay synced.
3. Replace `public/provenance/coastal-morning-proof-preview.mp4` with the real
   synced proof preview.

Do not generate random new AI stills unless Tony explicitly asks. The prior
image generation attempt drifted badly and wasted time.

## Recommended First Prompt For Fresh Chat

Copy this into a new Codex chat:

```text
We are continuing the AWO build in C:\HatchVision\AWO\GPT-Codex. Read NEXT_CHAT_HANDOFF.md first, then docs/CURRENT_CONTEXT.md and docs/PRODUCTION_GAP_AUDIT.md only as needed. Do not load the old long chat. We are currently fixing the Coastal Morning provenance proof preview. The current local page is http://127.0.0.1:3010/shop/coastal-morning. I want a real 6-second hand-painting animation, not a still-image zoom. Help me use Runway or another video model to create the master visual clip, then derive synced TOF and thermal layers and wire the result into the product page. Keep Linear/GitHub as source of truth and do not recreate apps/web.
```

## Local Commands

Use a fresh server instead of stale long-running ports:

```powershell
npm run dev -- -p 3010
```

Checks:

```powershell
npm run lint
npm run build
$env:SMOKE_BASE_URL='http://127.0.0.1:3010'; npm run test:smoke; Remove-Item Env:\SMOKE_BASE_URL
```

## Best Practice Going Forward

- Start a fresh chat for each big work block.
- Keep each chat focused on one outcome.
- Put continuity in repo files and Linear, not in chat memory.
- Before long autonomous work, update this file and `docs/CURRENT_CONTEXT.md`.
- Commit/push after verified working increments.
- If the browser or local app gets weird, restart the local dev server and use a
  fresh port.
