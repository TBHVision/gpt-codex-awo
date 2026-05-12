# Supabase Schema

Linear issue: AWO-5

This is the initial GPT-Codex AWO data model. It starts clean in the HatchVision-owned Supabase project. The Claude Code prototype is reference material only.

## Design Principles

- Keep buyer, artist, recipient, and admin data in one explicit model.
- Store money as integer cents, not decimals.
- Use generated public IDs for QR/PIN reveal flows instead of exposing internal IDs.
- Enable RLS on every application table from the first migration.
- Add strict policies in AWO-6 after the table model is reviewed.
- Keep service-role access server-only.

## Initial Entities

| Entity | Purpose |
| --- | --- |
| `profiles` | One row per Supabase auth user with role and display fields. |
| `artists` | Artist storefront and approval record linked to a profile. |
| `cards` | Greeting card catalog entries created by artists and approved by admins. Raw table is artist/admin oriented. |
| `card_media` | Images, videos, and other media attached to cards. |
| `published_cards` | Public read view for the shop catalog. |
| `people` | Buyer-owned recipient records for My People. |
| `occasions` | Buyer-owned dates and gift/card moments tied to people. |
| `carts` | Buyer or anonymous cart shell. |
| `cart_items` | Card selections inside a cart. |
| `orders` | Checkout record and lifecycle state. |
| `order_items` | Purchased cards and generated reveal credentials. |
| `honoree_reveals` | QR/PIN reveal state for recipients. |
| `admin_audit_events` | Append-only operational audit trail. |

## AWO-37 Anonymous Order Drafts

Checkout drafts are created through `public.create_anonymous_order_draft(...)`.
The browser posts to the app server route at `/api/checkout/draft`; that server
route calls the narrow Supabase RPC with the browser-safe anon key. Direct
anonymous writes to `orders` and `order_items` remain blocked by RLS.

The RPC:

- validates that a recipient name and at least one item are present
- accepts published card slugs and quantities
- creates an `orders` row with `status = 'draft'`
- stores `recipient_name`, `occasion_label`, and `message_notes`
- creates matching `order_items`
- returns an `AWO-DRAFT-*` checkout reference
- does not collect payment

## AWO-39 People and Reminders

Signed-in buyer planning uses existing RLS-protected tables:

- `people` stores the recipient/contact row for the authenticated buyer.
- `occasions` stores reminder/planning intent tied to a person where possible.

The browser uses the buyer's Supabase Auth access token, so reads and writes run
through the same owner policies as the rest of the account model. Anonymous
users keep local browser storage and cannot read `people` or `occasions`.

## AWO-41 Honoree Reveal Verification

Reveal validation uses `public.verify_honoree_reveal(card_code, pin)` through
the app server route `/api/reveal/verify`.

The RPC:

- looks up `order_items.reveal_public_id`
- checks the submitted PIN against `order_items.reveal_pin_hash`
- increments failed attempts for invalid PINs
- marks a reveal opened on successful verification
- returns only safe card, artist, evidence, custody, and ownership fields

Current demo seed:

- Card code: `AWO-DEMO-001`
- PIN: `1234`
- Order reference: `AWO-DEMO-REVEAL`

Raw PINs are not returned to browser code.

## AWO-42 Artist Studio Drafts

Approved artist profiles are public storefront data. The `/artists` page reads
approved rows from `artists` through the browser-safe Supabase anon key and RLS.

Studio drafts use the existing `cards` table with these added draft fields:

- `provenance_checklist text[]`
- `studio_notes text`

Signed-in artist/admin sessions read and write drafts through Supabase Auth
access tokens. Artists can only manage draft cards tied to their own artist
record. Admins can inspect draft cards for operational review. Guests keep local
browser storage and do not write studio drafts to Supabase.

## AWO-43 Lifecycle Model

The production lifecycle model is documented in `docs/LIFECYCLE_MODEL.md`.

Current schema already has coarse status enums:

- `order_status`: `draft`, `pending_payment`, `paid`, `fulfilled`, `canceled`,
  `refunded`
- `reveal_status`: `not_started`, `opened`, `completed`, `locked`

These are enough for the current draft checkout and demo reveal path, but they
are not enough for production payment, fulfillment, custody, and ownership.

Required follow-up schema work:

- AWO-45 implements the first schema layer for this model.

## AWO-45 Lifecycle Schema

AWO-45 adds lifecycle-specific state without forcing payment or fulfillment
automation to exist yet.

New enums:

- `payment_lifecycle_status`
- `fulfillment_lifecycle_status`
- `order_item_status`
- `reveal_credential_status`
- `custody_event_type`
- `ownership_status`

Updated tables:

- `orders` now has `payment_status`, `fulfillment_status`, payment provider
  IDs, and transition timestamps.
- `order_items` now has item-level `status`.
- `honoree_reveals` now has `credential_status`, expiration/revocation fields,
  and `max_failed_attempts`.

New tables:

- `custody_events`: append-only provenance event stream for cards and order
  items.
- `ownership_records`: durable ownership claims tied to purchased order items.

RLS direction:

- Admins can inspect and manage custody/ownership records.
- Buyers can read ownership/custody records tied to their orders.
- Artists can read custody/ownership context for their own cards.
- Recipients still receive curated reveal/custody/ownership data through the
  server-mediated reveal path, not direct table reads.

## AWO-47 Reveal Lifecycle Rules

`public.verify_honoree_reveal(card_code, pin)` now checks
`honoree_reveals.credential_status` before returning any card, artist, custody,
or ownership payload.

Safe blocked states:

- `pending_generation`
- `locked`
- `expired`
- `revoked`
- `generation_failed`

Invalid PIN attempts increment `failed_attempts`. When the attempt count reaches
`max_failed_attempts`, the credential is moved to `locked` and the legacy
`honoree_reveals.status` is also set to `locked`.

Successful reveals:

- move `credential_status` from `active` to `opened`
- move legacy reveal status from `not_started` to `opened`
- preserve `completed` when already completed
- emit a `custody_events` row with event type `recipient_revealed`

## AWO-69 Fulfillment Transition Foundation

Stripe checkout completion now moves matching reserved `order_items` into
`purchased` and emits `order_paid` custody events. This keeps paid orders from
staying invisible to item-level fulfillment queues.

The migration also adds
`public.admin_transition_fulfillment_item(order_item_id, next_status, actor_profile_id, note)`.
The RPC:

- requires `actor_profile_id` to belong to a `profiles.role = 'admin'` row
- only allows explicit item-status transitions
- blocks fulfillment progress unless the parent order payment state permits it
- updates the parent order fulfillment rollup when items enter production or all
  items complete
- writes `admin_audit_events` for every actual transition
- emits custody events for `order_paid`, `credential_activated`, and
  `item_fulfilled` transitions

The admin UI still does not expose fulfillment write buttons. This RPC is the
foundation those controls must use later.

## AWO-77 Reveal Credential Generation

`public.generate_order_item_reveal_credential(order_item_id, actor_profile_id, note)`
now creates a production QR/PIN credential packet for a paid order item.

The RPC:

- requires `actor_profile_id` to belong to a `profiles.role = 'admin'` row
- only runs for paid items in `purchased`, `credential_pending`, or incomplete
  `credential_active` states
- generates a unique `AWO-...` reveal code
- generates a six-digit PIN and stores only `extensions.crypt(...)` in
  `order_items.reveal_pin_hash`
- returns the raw PIN only in the trusted RPC response for print/fulfillment
  handoff
- activates or creates the matching `honoree_reveals` row
- emits `credential_activated` custody evidence
- writes a `reveal_credential_generated` admin audit event

The `/admin/fulfillment` page exposes this as a named-admin-only Generate
QR/PIN action and shows the one-time credential packet after generation.

## AWO-71 Ownership Lifecycle Wiring

Stripe checkout completion now creates or updates a pending `ownership_records`
row for every paid order item. The record is tied to the item, card, buyer
profile when available, and recipient person when available.

When `admin_transition_fulfillment_item(...)` moves an item to `completed`, the
matching ownership record becomes `active`, gets an `activated_at` timestamp,
and emits an `ownership_recorded` custody event.

Ownership transfer, revocation, refund correction, and recipient-claim flows are
still separate future workflows. They should use audited server-side state
transitions rather than direct browser writes.

## Role Model

`profiles.role` is intentionally simple for V0.1:

- `buyer`
- `artist`
- `admin`

Future versions can split operational roles if needed.

AWO-38 adds a Supabase Auth trigger that creates a `profiles` row with role
`buyer` whenever a new auth user signs up. User-facing signup never chooses
`artist` or `admin`.

## RLS Boundary

The first migration enables RLS. AWO-6 adds the first policy layer before product routes read or write live data.

Policy direction:

- Buyers can read/write their own people, occasions, carts, and orders.
- Artists can read/write their own artist profile and draft cards.
- Public visitors read published, approved card catalog fields through `published_cards`.
- Recipients will access reveal records through a server-side API/RPC that verifies public reveal ID and PIN.
- Admins can manage approvals and operational records.

Anonymous carts and checkout drafts use server-mediated flows. Direct anonymous
table writes are not exposed in the first RLS layer.

## Environment Variables

Browser-safe:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`

Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code or client components.
