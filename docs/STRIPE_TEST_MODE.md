# Stripe Test Mode

AWO payment wiring is intentionally test-mode only until Tony explicitly
approves live charges.

## Required Environment Variables

Set these values in local `.env.local` and in Vercel Project Settings when
ready to verify Stripe:

| Variable | Scope | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Server only | Must start with `sk_test_`. Live keys are rejected by the app. |
| `STRIPE_WEBHOOK_SECRET` | Server only | Must start with `whsec_`. Created after registering the webhook endpoint. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Required so server routes can update order payment lifecycle fields. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Existing Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Existing Supabase anon key. |

No Stripe secret is ever sent to browser code.

## Webhook Endpoint

Register this endpoint in Stripe test mode:

`https://gpt-codex-awo-dashboard.vercel.app/api/stripe/webhook`

Subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

## Lifecycle Behavior

- Checkout creates a Supabase order draft first.
- The server creates a Stripe Checkout Session from trusted database prices.
- The order moves to `status = pending_payment` and
  `payment_status = pending` only after Stripe returns a session.
- The webhook moves the order to `status = paid` and
  `payment_status = paid` after `checkout.session.completed`.
- Failed or expired sessions update `payment_status` to `failed` or
  `canceled`.

## Verification Notes

Before live charges are considered, capture evidence that:

- the checkout button redirects to Stripe test checkout
- test card success produces a webhook event
- the order moves to paid server-side
- failed or expired payment states do not expose card/artist reveal data
