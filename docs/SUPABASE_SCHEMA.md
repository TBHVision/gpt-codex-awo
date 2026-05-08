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
| `cards` | Greeting card catalog entries created by artists and approved by admins. |
| `card_media` | Images, videos, and other media attached to cards. |
| `people` | Buyer-owned recipient records for My People. |
| `occasions` | Buyer-owned dates and gift/card moments tied to people. |
| `carts` | Buyer or anonymous cart shell. |
| `cart_items` | Card selections inside a cart. |
| `orders` | Checkout record and lifecycle state. |
| `order_items` | Purchased cards and generated reveal credentials. |
| `honoree_reveals` | QR/PIN reveal state for recipients. |
| `admin_audit_events` | Append-only operational audit trail. |

## Role Model

`profiles.role` is intentionally simple for V0.1:

- `buyer`
- `artist`
- `admin`

Future versions can split operational roles if needed.

## RLS Boundary

The first migration enables RLS but keeps policies out of scope for AWO-5. AWO-6 must add and test policies before product routes read or write live data.

Expected policy direction:

- Buyers can read/write their own people, occasions, carts, and orders.
- Artists can read/write their own artist profile and draft cards.
- Public visitors can read only published, approved card catalog fields.
- Recipients can access reveal records only with a valid public reveal ID and PIN flow.
- Admins can manage approvals and operational records.

## Environment Variables

Browser-safe:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`

Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code or client components.
