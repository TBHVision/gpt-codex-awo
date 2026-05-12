export type FulfillmentTransitionStatus =
  | "credential_active"
  | "credential_pending"
  | "completed"
  | "purchased";

type TransitionRow = {
  current_status: string;
  order_fulfillment_status: string;
  order_item_id: string;
  previous_status: string;
};

export type GeneratedRevealCredential = {
  credential_status: string;
  item_status: string;
  order_item_id: string;
  reveal_pin: string;
  reveal_public_id: string;
};

function getConfig() {
  return {
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };
}

function headersFor(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function transitionFulfillmentItem(input: {
  adminUserId: string | undefined;
  itemId: string;
  nextStatus: FulfillmentTransitionStatus;
}) {
  const { serviceRoleKey, supabaseUrl } = getConfig();

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error("Fulfillment actions require Supabase service-role access.");
  }

  if (!input.adminUserId) {
    throw new Error("Named Supabase admin login is required for fulfillment actions.");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/admin_transition_fulfillment_item`,
    {
      body: JSON.stringify({
        p_actor_profile_id: input.adminUserId,
        p_next_status: input.nextStatus,
        p_note: "Transitioned from /admin/fulfillment.",
        p_order_item_id: input.itemId,
      }),
      cache: "no-store",
      headers: headersFor(serviceRoleKey),
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Fulfillment transition failed.");
  }

  const rows = (await response.json()) as TransitionRow[];
  return rows[0] ?? null;
}

export async function generateRevealCredential(input: {
  adminUserId: string | undefined;
  itemId: string;
}) {
  const { serviceRoleKey, supabaseUrl } = getConfig();

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error("Credential generation requires Supabase service-role access.");
  }

  if (!input.adminUserId) {
    throw new Error("Named Supabase admin login is required for credential generation.");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/generate_order_item_reveal_credential`,
    {
      body: JSON.stringify({
        p_actor_profile_id: input.adminUserId,
        p_note: "Generated from /admin/fulfillment.",
        p_order_item_id: input.itemId,
      }),
      cache: "no-store",
      headers: headersFor(serviceRoleKey),
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Reveal credential generation failed.");
  }

  const rows = (await response.json()) as GeneratedRevealCredential[];
  return rows[0] ?? null;
}
