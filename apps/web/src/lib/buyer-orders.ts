"use client";

import type { BuyerSession } from "@/lib/buyer-auth";

export type BuyerOrderSummary = {
  checkoutReference: string;
  createdAt: string;
  currency: string;
  fulfillmentStatus: string;
  id: string;
  paymentStatus: string;
  recipientName: string;
  status: string;
  totalCents: number;
};

type BuyerOrderRow = {
  checkout_reference: string;
  created_at: string;
  currency: string | null;
  fulfillment_status: string | null;
  id: string;
  payment_status: string | null;
  recipient_name: string | null;
  status: string | null;
  total_cents: number | null;
};

function getSupabaseBrowserConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase browser configuration is missing.");
  }

  return { anonKey, supabaseUrl };
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message || "Order history could not be loaded.";
  } catch {
    return "Order history could not be loaded.";
  }
}

export async function fetchBuyerOrderHistory(session: BuyerSession) {
  const config = getSupabaseBrowserConfig();
  const endpoint = new URL("/rest/v1/orders", config.supabaseUrl);
  endpoint.searchParams.set(
    "select",
    "id,checkout_reference,recipient_name,status,payment_status,fulfillment_status,total_cents,currency,created_at",
  );
  endpoint.searchParams.set("order", "created_at.desc");
  endpoint.searchParams.set("limit", "20");

  const response = await fetch(endpoint, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const rows = (await response.json()) as BuyerOrderRow[];

  return rows.map((row) => ({
    checkoutReference: row.checkout_reference,
    createdAt: row.created_at,
    currency: row.currency ?? "USD",
    fulfillmentStatus: row.fulfillment_status ?? "not_started",
    id: row.id,
    paymentStatus: row.payment_status ?? "unpaid",
    recipientName: row.recipient_name ?? "Recipient",
    status: row.status ?? "draft",
    totalCents: row.total_cents ?? 0,
  })) satisfies BuyerOrderSummary[];
}
