# V0.1 Seed Data Plan

Linear issue: AWO-8

Seed data supports demo and development workflows for V0.2 public shop and V0.3 honoree reveal. It is not real production customer data.

## Goals

- Provide enough data to build and test the public shop.
- Provide enough data to build and test the honoree QR/PIN reveal.
- Keep seed data clearly fake and resettable.
- Avoid inserting real customer, artist, payment, or recipient data.

## Minimum Demo Data

### Artist

- One approved demo artist.
- Public name: `HatchVision Studio`
- Slug: `hatchvision-studio`
- Bio: short, obviously demo-safe text.

### Cards

At least three published cards for V0.2:

- Birthday card
- Encouragement card
- Sympathy/support card

Each card needs:

- title
- slug
- description
- occasion tags
- recipient tags
- price in cents
- published status

### Buyer And My People

At least one demo buyer profile for V0.4 planning:

- buyer profile
- two people records
- two occasions

This can remain disabled until auth UI exists.

### Honoree Reveal

At least one paid/demo order path for V0.3:

- order
- order item
- reveal public ID
- PIN hash placeholder
- honoree reveal row

Reveal seed data should not include a real PIN. The V0.3 implementation should generate and hash a demo PIN through server code or a controlled seed script.

## Separation From Production

Seed files are development/demo helpers. They must not be run blindly against production once real customer data exists.

Recommended guardrails:

- Keep seed files under `supabase/seed/`.
- Use fake `.test` emails only.
- Use obvious demo names.
- Add a reset/reseed command only after the team accepts the blast radius.
- Never seed real payment records or live Stripe IDs.

## Reset Strategy

For V0.1/V0.2, reset can be destructive because no real production data should exist yet.

Later production-safe reseeding should:

- Upsert by stable demo slugs or IDs.
- Avoid deleting real rows.
- Run only in local/preview unless explicitly approved.

## Current Seed Files

- `supabase/seed/001_demo_catalog.sql`

This file creates a demo artist and three published cards only. It avoids buyer/order/reveal rows until the auth/session and reveal implementation are ready.

## RLS Note

Public catalog reads should use the `published_cards` view, not direct anonymous reads from `cards`. The raw table is for artist/admin workflows.
