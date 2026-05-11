import Stripe from "stripe";
import type { CartItem } from "@/lib/cart-types";
import { verifyBuyerAccessToken } from "@/lib/buyer-session-server";

type DraftRpcRow = {
  checkout_reference: string;
  item_count: number;
  order_id: string;
  subtotal_cents: number;
  total_cents: number;
};

type OrderItemRow = {
  card_id: string;
  id: string;
  line_total_cents: number;
  quantity: number;
  status?: string;
  unit_price_cents: number;
};

type CardRow = {
  id: string;
  slug: string;
  title: string;
};

export type CheckoutSessionInput = {
  buyerAccessToken?: string;
  items?: CartItem[];
  messageNotes?: string;
  occasionLabel?: string;
  recipientName?: string;
};

export type CheckoutSessionResult = {
  checkoutReference: string;
  checkoutUrl: string;
  orderId: string;
  sessionId: string;
};

type SupabaseServerConfig = {
  anonKey: string;
  serviceRoleKey: string;
  supabaseUrl: string;
};

function getSupabaseServerConfig(): SupabaseServerConfig | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return null;
  }

  return { anonKey, serviceRoleKey, supabaseUrl };
}

export function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    return null;
  }

  if (!key.startsWith("sk_test_")) {
    throw new Error("AWO Stripe checkout only accepts test-mode secret keys.");
  }

  return key;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return null;
  }

  if (!secret.startsWith("whsec_")) {
    throw new Error("STRIPE_WEBHOOK_SECRET must be a webhook signing secret.");
  }

  return secret;
}

export function getStripeClient() {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey);
}

function sanitizeItems(items: CartItem[] | undefined) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      quantity: Math.max(1, Math.min(Number(item.quantity) || 1, 25)),
      slug: String(item.slug || "").trim(),
    }))
    .filter((item) => item.slug.length > 0)
    .slice(0, 20);
}

function supabaseHeaders(config: SupabaseServerConfig) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

async function createDraft(
  config: SupabaseServerConfig,
  input: CheckoutSessionInput,
) {
  const endpoint = new URL(
    "/rest/v1/rpc/create_anonymous_order_draft",
    config.supabaseUrl,
  );

  const response = await fetch(endpoint, {
    body: JSON.stringify({
      items: sanitizeItems(input.items),
      message_notes: String(input.messageNotes || "").trim(),
      occasion_label: String(input.occasionLabel || "").trim(),
      recipient_name: String(input.recipientName || "").trim(),
    }),
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Checkout draft could not be saved before payment.");
  }

  const rows = (await response.json()) as DraftRpcRow[];
  const draft = rows[0];

  if (!draft) {
    throw new Error("Checkout draft did not return a confirmation.");
  }

  return draft;
}

async function fetchOrderItems(config: SupabaseServerConfig, orderId: string) {
  const endpoint = new URL("/rest/v1/order_items", config.supabaseUrl);
  endpoint.searchParams.set(
    "select",
    "id,card_id,quantity,unit_price_cents,line_total_cents",
  );
  endpoint.searchParams.set("order_id", `eq.${orderId}`);
  endpoint.searchParams.set("order", "created_at.asc");

  const response = await fetch(endpoint, {
    headers: supabaseHeaders(config),
  });

  if (!response.ok) {
    throw new Error("Checkout order items could not be loaded.");
  }

  return (await response.json()) as OrderItemRow[];
}

async function fetchCards(config: SupabaseServerConfig, cardIds: string[]) {
  const endpoint = new URL("/rest/v1/cards", config.supabaseUrl);
  endpoint.searchParams.set("select", "id,title,slug");
  endpoint.searchParams.set("id", `in.(${cardIds.join(",")})`);

  const response = await fetch(endpoint, {
    headers: supabaseHeaders(config),
  });

  if (!response.ok) {
    throw new Error("Checkout card details could not be loaded.");
  }

  return (await response.json()) as CardRow[];
}

async function markOrderPendingPayment(
  config: SupabaseServerConfig,
  draft: DraftRpcRow,
  session: Stripe.Checkout.Session,
  buyerProfileId?: string,
) {
  const endpoint = new URL("/rest/v1/orders", config.supabaseUrl);
  endpoint.searchParams.set("id", `eq.${draft.order_id}`);

  const response = await fetch(endpoint, {
    body: JSON.stringify({
      buyer_profile_id: buyerProfileId,
      payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      payment_provider: "stripe",
      payment_session_id: session.id,
      payment_status: "pending",
      status: "pending_payment",
    }),
    headers: {
      ...supabaseHeaders(config),
      Prefer: "return=minimal",
    },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Checkout order could not be marked pending payment.");
  }
}

export async function createCheckoutSession(
  input: CheckoutSessionInput,
  requestOrigin: string,
): Promise<CheckoutSessionResult> {
  const config = getSupabaseServerConfig();
  const stripe = getStripeClient();

  if (!config || !stripe) {
    throw new Error("Stripe test checkout is not configured yet.");
  }

  const draft = await createDraft(config, input);
  const verifiedBuyer = await verifyBuyerAccessToken(
    config,
    input.buyerAccessToken,
  );
  const orderItems = await fetchOrderItems(config, draft.order_id);
  const cards = await fetchCards(
    config,
    Array.from(new Set(orderItems.map((item) => item.card_id))),
  );
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  if (orderItems.length === 0) {
    throw new Error("Checkout draft has no payable items.");
  }

  const session = await stripe.checkout.sessions.create({
    cancel_url: `${requestOrigin}/checkout?payment=cancelled&order=${draft.checkout_reference}`,
    line_items: orderItems.map((item) => {
      const card = cardsById.get(item.card_id);

      return {
        price_data: {
          currency: "usd",
          product_data: {
            metadata: {
              card_id: item.card_id,
              slug: card?.slug ?? "unknown-card",
            },
            name: card?.title ?? "AWO Card",
          },
          unit_amount: item.unit_price_cents,
        },
        quantity: item.quantity,
      };
    }),
    metadata: {
      checkout_reference: draft.checkout_reference,
      order_id: draft.order_id,
    },
    mode: "payment",
    payment_intent_data: {
      metadata: {
        checkout_reference: draft.checkout_reference,
        order_id: draft.order_id,
      },
    },
    success_url: `${requestOrigin}/checkout?payment=success&order=${draft.checkout_reference}`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  await markOrderPendingPayment(config, draft, session, verifiedBuyer?.id);

  return {
    checkoutReference: draft.checkout_reference,
    checkoutUrl: session.url,
    orderId: draft.order_id,
    sessionId: session.id,
  };
}

async function patchOrderBySession(
  sessionId: string,
  payload: Record<string, unknown>,
) {
  const config = getSupabaseServerConfig();

  if (!config) {
    throw new Error("Supabase service role is not configured.");
  }

  const endpoint = new URL("/rest/v1/orders", config.supabaseUrl);
  endpoint.searchParams.set("payment_session_id", `eq.${sessionId}`);

  const response = await fetch(endpoint, {
    body: JSON.stringify(payload),
    headers: {
      ...supabaseHeaders(config),
      Prefer: "return=minimal",
    },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Order payment lifecycle update failed.");
  }
}

type StripeOrderRow = {
  id: string;
};

async function fetchOrderBySession(config: SupabaseServerConfig, sessionId: string) {
  const endpoint = new URL("/rest/v1/orders", config.supabaseUrl);
  endpoint.searchParams.set("select", "id");
  endpoint.searchParams.set("payment_session_id", `eq.${sessionId}`);
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: supabaseHeaders(config),
  });

  if (!response.ok) {
    throw new Error("Paid order could not be loaded for item lifecycle update.");
  }

  const rows = (await response.json()) as StripeOrderRow[];
  return rows[0] ?? null;
}

async function markOrderItemsPurchased(config: SupabaseServerConfig, orderId: string) {
  const itemsEndpoint = new URL("/rest/v1/order_items", config.supabaseUrl);
  itemsEndpoint.searchParams.set("select", "id,card_id,status");
  itemsEndpoint.searchParams.set("order_id", `eq.${orderId}`);

  const itemsResponse = await fetch(itemsEndpoint, {
    headers: supabaseHeaders(config),
  });

  if (!itemsResponse.ok) {
    throw new Error("Paid order items could not be loaded.");
  }

  const items = (await itemsResponse.json()) as OrderItemRow[];
  const reservedItems = items.filter((item) => item.status === "reserved");

  if (reservedItems.length === 0) {
    return;
  }

  const patchEndpoint = new URL("/rest/v1/order_items", config.supabaseUrl);
  patchEndpoint.searchParams.set("order_id", `eq.${orderId}`);
  patchEndpoint.searchParams.set("status", "eq.reserved");

  const patchResponse = await fetch(patchEndpoint, {
    body: JSON.stringify({ status: "purchased" }),
    headers: {
      ...supabaseHeaders(config),
      Prefer: "return=minimal",
    },
    method: "PATCH",
  });

  if (!patchResponse.ok) {
    throw new Error("Paid order items could not be moved into fulfillment.");
  }

  const custodyResponse = await fetch(`${config.supabaseUrl}/rest/v1/custody_events`, {
    body: JSON.stringify(
      reservedItems.map((item) => ({
        card_id: item.card_id,
        event_payload: {
          order_id: orderId,
          source: "stripe_checkout_completed",
        },
        event_type: "order_paid",
        order_item_id: item.id,
      })),
    ),
    headers: {
      ...supabaseHeaders(config),
      Prefer: "return=minimal",
    },
    method: "POST",
  });

  if (!custodyResponse.ok) {
    throw new Error("Paid order item custody events could not be recorded.");
  }
}

async function markCheckoutSessionPaid(session: Stripe.Checkout.Session) {
  const config = getSupabaseServerConfig();

  if (!config) {
    throw new Error("Supabase service role is not configured.");
  }

  const sessionId = session.id;
  const order = await fetchOrderBySession(config, sessionId);

  if (!order) {
    throw new Error("Paid checkout session did not match an AWO order.");
  }

  await patchOrderBySession(sessionId, {
    paid_at: new Date().toISOString(),
    payment_intent_id:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    payment_status: "paid",
    status: "paid",
  });
  await markOrderItemsPurchased(config, order.id);
}

export async function handleStripeCheckoutEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    await markCheckoutSessionPaid(session);
    return;
  }

  if (
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "checkout.session.expired"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;

    await patchOrderBySession(session.id, {
      canceled_at:
        event.type === "checkout.session.expired"
          ? new Date().toISOString()
          : undefined,
      payment_status:
        event.type === "checkout.session.expired" ? "canceled" : "failed",
      status:
        event.type === "checkout.session.expired"
          ? "canceled"
          : "pending_payment",
    });
  }
}
