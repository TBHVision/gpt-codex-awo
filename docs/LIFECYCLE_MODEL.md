# AWO Lifecycle Model

Linear issue: AWO-43

This model defines the production state language for orders, reveal credentials,
custody, and ownership before payment, fulfillment, and provenance automation are
wired deeper into the app.

## Principles

- State changes are append-only where trust matters.
- Browser code can request a state transition, but server routes or Supabase RPCs
  perform sensitive transitions.
- Payment, fulfillment, reveal, custody, and ownership are related but not the
  same lifecycle. Avoid one overloaded `orders.status` field for everything.
- Every externally meaningful transition should have an audit/event row.
- Demo seed records can use the same lifecycle states but must be clearly marked
  as demo/test data.

## Order Lifecycle

The order lifecycle tracks commercial intent and purchase state.

| State | Meaning | Entry Trigger | Allowed Next States | Existing Mapping |
| --- | --- | --- | --- | --- |
| `draft` | Checkout intent exists but no payment attempt has started. | Cart checkout draft created. | `pending_payment`, `canceled` | Exists on `orders.status`. |
| `pending_payment` | Payment session or invoice exists and awaits confirmation. | Stripe checkout/session created. | `paid`, `payment_failed`, `canceled` | Enum value exists, but payment session fields do not. |
| `payment_failed` | A payment attempt failed and the buyer may retry. | Payment provider failure webhook. | `pending_payment`, `canceled` | Missing enum value. |
| `paid` | Funds are captured or authorized according to payment policy. | Payment provider success webhook. | `in_production`, `refunded`, `canceled` | Exists on `orders.status`. |
| `in_production` | Card/order is being prepared, printed, packaged, or digitally assembled. | Ops accepts paid order for fulfillment. | `fulfilled`, `canceled`, `refunded` | Missing enum value. |
| `fulfilled` | Fulfillment has completed enough to issue reveal credentials. | Physical shipment/digital delivery complete. | `partially_refunded`, `refunded` | Exists on `orders.status`, but too broad. |
| `canceled` | Order is intentionally stopped before completion. | Buyer/admin cancellation. | none or `refunded` if funds moved. | Exists on `orders.status`. |
| `partially_refunded` | Some money returned, but order remains partially valid. | Payment provider partial refund. | `refunded` | Missing enum value. |
| `refunded` | Money returned and order should no longer imply ownership. | Payment provider full refund. | none | Exists on `orders.status`. |

### Recommended Order Schema Changes

- Add `payment_status` or expand `order_status` with `payment_failed`,
  `in_production`, and `partially_refunded`.
- Add payment provider fields to `orders`: `payment_provider`,
  `payment_session_id`, `payment_intent_id`, `paid_at`, `canceled_at`,
  `refunded_at`.
- Add `order_events` as an append-only event log for order/payment transitions.
- Keep anonymous draft creation, but move paid transitions to server-only webhook
  handling.

## Order Item And Fulfillment Lifecycle

Order item lifecycle tracks each purchased card. This matters because a single
order can include multiple cards with different artists, recipients, or reveal
timelines.

| State | Meaning | Entry Trigger | Allowed Next States | Existing Mapping |
| --- | --- | --- | --- | --- |
| `reserved` | Item selected in a draft order. | Draft order item created. | `purchased`, `canceled` | No explicit item status. |
| `purchased` | Item belongs to a paid order. | Parent order becomes `paid`. | `credential_pending`, `canceled`, `refunded` | Implied by parent order. |
| `credential_pending` | Reveal credentials need generation or activation. | Paid item enters fulfillment path. | `credential_active`, `credential_blocked` | `reveal_public_id` currently exists immediately. |
| `credential_active` | Reveal public ID and PIN are ready for recipient. | Credential generation succeeds. | `revealed`, `locked`, `revoked`, `expired` | Implied by `honoree_reveals.status`. |
| `revealed` | Recipient opened or completed reveal. | Reveal verification succeeds. | `completed` | Partially mapped by `honoree_reveals`. |
| `completed` | Item journey is complete for this lifecycle. | Recipient completes reveal or admin closes. | none | Missing item-level state. |
| `canceled` | Item canceled before completion. | Admin/order transition. | none | Missing item-level state. |
| `refunded` | Item no longer confers active ownership. | Refund transition. | none | Missing item-level state. |

### Recommended Item Schema Changes

- Add `order_item_status` enum and `order_items.status`.
- Add `order_item_events` or include item events in a generic lifecycle event
  table.
- Delay usable reveal credential activation until payment/fulfillment says the
  item should be revealable.

## Reveal Credential Lifecycle

Reveal credential lifecycle tracks QR/PIN safety and recipient access.

| State | Meaning | Entry Trigger | Allowed Next States | Existing Mapping |
| --- | --- | --- | --- | --- |
| `pending_generation` | Order item needs a QR/PIN pair. | Paid item created. | `active`, `generation_failed` | Missing. |
| `active` | Credential can unlock reveal content. | QR/PIN generated and item eligible. | `opened`, `locked`, `expired`, `revoked` | Existing `not_started` roughly maps here. |
| `opened` | Correct PIN used at least once. | Successful verification. | `completed`, `locked`, `revoked` | Exists. |
| `completed` | Recipient journey completed or marked done. | Recipient/admin completion. | none | Exists. |
| `locked` | Too many failures or security concern. | Failed attempt threshold/admin action. | `active`, `revoked` | Exists. |
| `expired` | Credential is past allowed reveal window. | Scheduled/system rule. | `active`, `revoked` | Missing. |
| `revoked` | Credential permanently invalidated. | Refund, fraud, admin action. | none | Missing. |
| `generation_failed` | Credential creation failed and needs operator repair. | System error. | `pending_generation`, `revoked` | Missing. |

### Recommended Reveal Schema Changes

- Expand `reveal_status` or add `reveal_credential_status` with `active`,
  `expired`, `revoked`, and `generation_failed`.
- Add `expires_at`, `revoked_at`, `revocation_reason`, and
  `max_failed_attempts` to `honoree_reveals`.
- Update `verify_honoree_reveal` so locked/expired/revoked credentials return
  safe failure responses and never reveal card/artist payloads.
- Add a threshold rule: after too many invalid PIN attempts, status becomes
  `locked`.

## Chain Of Custody Lifecycle

Custody lifecycle is an event stream, not one mutable status. It should answer:
"What happened to this artwork/card record, in what order, and who or what
asserted it?"

| Event Type | Meaning | Actor |
| --- | --- | --- |
| `artwork_created` | Artist-origin record is created. | Artist/system |
| `evidence_attached` | Photos, notes, process records, or signed statements are attached. | Artist/system |
| `artist_verified` | Artist identity or account is approved. | Admin/system |
| `card_approved` | Card record passes review. | Admin |
| `card_published` | Card becomes publicly purchasable. | Admin/system |
| `order_paid` | Buyer payment succeeded. | Payment webhook |
| `item_fulfilled` | Physical/digital fulfillment completed. | Ops/system |
| `credential_activated` | Reveal credential becomes valid. | System |
| `recipient_revealed` | Recipient successfully opened reveal. | Recipient/system |
| `ownership_recorded` | Ownership claim is recorded for buyer/recipient. | System |
| `credential_revoked` | Reveal path is invalidated. | Admin/system |

### Recommended Custody Schema

Create `custody_events`:

- `id uuid primary key`
- `order_item_id uuid references order_items(id)`
- `card_id uuid references cards(id)`
- `actor_profile_id uuid references profiles(id)`
- `event_type text`
- `event_payload jsonb`
- `occurred_at timestamptz`
- `created_at timestamptz`

RLS direction:

- Public users never read raw custody events directly.
- Reveal RPC returns a curated subset after valid QR/PIN verification.
- Admins can read all custody events.
- Artists can read custody events for their own cards.

## Ownership Lifecycle

Ownership lifecycle tracks who currently has a trustworthy claim to the card or
gift record. It should not be inferred only from order status.

| State | Meaning | Entry Trigger | Allowed Next States |
| --- | --- | --- | --- |
| `pending` | Ownership record is expected but not active yet. | Paid order/item created. | `active`, `voided` |
| `active` | Ownership is valid and can be shown in reveal. | Fulfilled/revealed according to policy. | `transferred`, `revoked`, `refunded` |
| `transferred` | Ownership moved to another person/account. | Future transfer flow. | `active`, `revoked` |
| `revoked` | Ownership claim is invalidated. | Fraud/admin action. | none |
| `refunded` | Ownership claim removed because value was refunded. | Refund webhook/admin action. | none |
| `voided` | Pending ownership never became active. | Cancellation or failed payment. | none |

### Recommended Ownership Schema

Create `ownership_records`:

- `id uuid primary key`
- `order_item_id uuid references order_items(id)`
- `card_id uuid references cards(id)`
- `buyer_profile_id uuid references profiles(id)`
- `recipient_person_id uuid references people(id)`
- `status ownership_status`
- `ownership_summary text`
- `activated_at timestamptz`
- `transferred_at timestamptz`
- `revoked_at timestamptz`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

RLS direction:

- Buyers can read ownership records tied to their profile.
- Recipients only see ownership through a verified reveal RPC unless/until they
  have their own account model.
- Admins can manage ownership corrections.

## Existing Table Mapping

| Existing Table | Current Role | Lifecycle Gap |
| --- | --- | --- |
| `orders` | Draft checkout and coarse commercial status. | Needs payment provider fields and richer state/events. |
| `order_items` | Purchased card line items and reveal credential fields. | Needs item status and cleaner credential activation boundary. |
| `honoree_reveals` | Reveal attempt and open/completion status. | Needs active/expired/revoked/generation failure states and lock rules. |
| `cards` | Artist catalog and draft cards. | Provenance evidence exists only as checklist text, not media/event evidence yet. |
| `card_media` | Media attachments for cards. | Needs evidence classification and reveal-safe curation later. |
| `admin_audit_events` | Admin audit trail. | Should remain admin-focused; do not overload for custody/ownership. |
| missing `custody_events` | No durable chain-of-custody event stream. | Needed before production provenance claims. |
| missing `ownership_records` | No durable ownership claim model. | Needed before ownership can be trusted beyond copy. |

## Implementation Follow-Ups

1. AWO-45: Add lifecycle schema migration:
   - richer order/reveal enums
   - item status
   - payment provider fields
   - `custody_events`
   - `ownership_records`
2. AWO-46: Update checkout/payment server boundary:
   - Stripe test mode creates `pending_payment`
   - webhook moves orders to `paid` or `payment_failed`
3. AWO-47: Update reveal verification:
   - deny locked/expired/revoked credentials
   - lock after failed attempt threshold
   - emit custody events on successful reveal
4. AWO-48: Update admin ops:
   - show lifecycle queues by state
   - surface stuck states like `payment_failed`, `generation_failed`, and
     `locked`
5. AWO-44: Update QA:
   - add tests for valid/invalid lifecycle transitions
   - add smoke coverage for dynamic lifecycle routes as they appear
