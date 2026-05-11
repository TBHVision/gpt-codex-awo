import { NextResponse } from "next/server";
import type { CartItem } from "@/lib/cart-types";
import {
  attachOrderToBuyer,
  verifyBuyerAccessToken,
} from "@/lib/buyer-session-server";

type DraftRpcRow = {
  checkout_reference: string;
  item_count: number;
  order_id: string;
  subtotal_cents: number;
  total_cents: number;
};

type DraftRequestBody = {
  buyerAccessToken?: string;
  items?: CartItem[];
  messageNotes?: string;
  occasionLabel?: string;
  recipientName?: string;
};

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return { anonKey, supabaseUrl };
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

export async function POST(request: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { message: "Checkout is not configured for this environment." },
      { status: 503 },
    );
  }

  let body: DraftRequestBody;

  try {
    body = (await request.json()) as DraftRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Checkout request could not be read." },
      { status: 400 },
    );
  }

  const recipientName = String(body.recipientName || "").trim();
  const occasionLabel = String(body.occasionLabel || "").trim();
  const messageNotes = String(body.messageNotes || "").trim();
  const items = sanitizeItems(body.items);

  if (!recipientName) {
    return NextResponse.json(
      { message: "Recipient name is required." },
      { status: 400 },
    );
  }

  if (items.length === 0) {
    return NextResponse.json(
      { message: "Add at least one card before saving a checkout draft." },
      { status: 400 },
    );
  }

  const endpoint = new URL(
    "/rest/v1/rpc/create_anonymous_order_draft",
    config.supabaseUrl,
  );

  const response = await fetch(endpoint, {
    body: JSON.stringify({
      items,
      message_notes: messageNotes,
      occasion_label: occasionLabel,
      recipient_name: recipientName,
    }),
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: "Checkout draft could not be saved yet." },
      { status: response.status >= 500 ? 502 : 400 },
    );
  }

  const rows = (await response.json()) as DraftRpcRow[];
  const draft = rows[0];

  if (!draft) {
    return NextResponse.json(
      { message: "Checkout draft did not return a confirmation." },
      { status: 502 },
    );
  }

  const verifiedBuyer = await verifyBuyerAccessToken(
    config,
    body.buyerAccessToken,
  );
  const buyerAttached = verifiedBuyer
    ? await attachOrderToBuyer(config, draft.order_id, verifiedBuyer.id)
    : false;

  return NextResponse.json({
    draft: {
      buyerAttached,
      checkoutReference: draft.checkout_reference,
      itemCount: draft.item_count,
      orderId: draft.order_id,
      subtotalCents: draft.subtotal_cents,
      totalCents: draft.total_cents,
    },
    ok: true,
  });
}
