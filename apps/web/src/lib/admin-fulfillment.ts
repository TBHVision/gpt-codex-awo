export type FulfillmentItem = {
  artistName: string;
  cardTitle: string;
  itemStatus: string;
  ownershipStatus: string;
  quantity: number;
  revealCredentialStatus: string;
  revealPublicId: string;
};

export type FulfillmentOrder = {
  checkoutReference: string;
  createdAt: string;
  fulfillmentStatus: string;
  items: FulfillmentItem[];
  paymentStatus: string;
  recipientName: string;
  status: string;
  total: string;
};

export type FulfillmentMetric = {
  label: string;
  state: "blocked" | "healthy" | "warning";
  value: string;
};

export type AdminFulfillmentSnapshot = {
  generatedAt: string;
  health: FulfillmentMetric[];
  mode: "full" | "limited";
  orders: FulfillmentOrder[];
};

type SupabaseFulfillmentOrderRow = {
  checkout_reference: string | null;
  created_at: string;
  fulfillment_status: string;
  order_items?: {
    artists?: { public_name?: string } | null;
    cards?: { title?: string } | null;
    honoree_reveals?: {
      credential_status?: string;
      status?: string;
    } | null;
    ownership_records?: {
      status?: string;
    }[] | null;
    quantity: number;
    reveal_public_id: string;
    status: string;
  }[];
  payment_status: string;
  recipient_name: string | null;
  status: string;
  total_cents: number;
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
  };
}

function countFromContentRange(value: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function formatCount(value: number | null) {
  return value === null ? "Unavailable" : value.toLocaleString("en-US");
}

function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(cents / 100);
}

async function fetchCount(input: {
  key: string;
  path: string;
  supabaseUrl: string;
}) {
  const response = await fetch(`${input.supabaseUrl}${input.path}`, {
    cache: "no-store",
    headers: {
      ...headersFor(input.key),
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  if (!response.ok) {
    return null;
  }

  return countFromContentRange(response.headers.get("content-range"));
}

async function fetchFulfillmentOrders(input: {
  key: string;
  supabaseUrl: string;
}) {
  const response = await fetch(
    `${input.supabaseUrl}/rest/v1/orders?select=checkout_reference,recipient_name,status,payment_status,fulfillment_status,total_cents,created_at,order_items(status,quantity,reveal_public_id,cards(title),artists(public_name),honoree_reveals(status,credential_status),ownership_records(status))&payment_status=in.(paid,pending)&order=created_at.desc&limit=10`,
    {
      cache: "no-store",
      headers: headersFor(input.key),
    },
  );

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as SupabaseFulfillmentOrderRow[];
}

export async function loadAdminFulfillmentSnapshot(): Promise<AdminFulfillmentSnapshot> {
  const { serviceRoleKey, supabaseUrl } = getConfig();
  const missing = [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
  ].filter(Boolean) as string[];

  if (missing.length > 0 || !supabaseUrl || !serviceRoleKey) {
    return {
      generatedAt: new Date().toISOString(),
      health: [
        {
          label: "Fulfillment configuration",
          state: "blocked",
          value: `Missing ${missing.join(", ")}`,
        },
      ],
      mode: "limited",
      orders: [],
    };
  }

  const [
    orders,
    paidOrders,
    inProductionOrders,
    fulfilledOrders,
    credentialPendingItems,
    ownershipPendingRecords,
  ] = await Promise.all([
    fetchFulfillmentOrders({ key: serviceRoleKey, supabaseUrl }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/orders?select=id&payment_status=eq.paid",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/orders?select=id&fulfillment_status=eq.in_production",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/orders?select=id&fulfillment_status=eq.fulfilled",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/order_items?select=id&status=eq.credential_pending",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/ownership_records?select=id&status=eq.pending",
      supabaseUrl,
    }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    health: [
      {
        label: "Paid orders",
        state: "healthy",
        value: formatCount(paidOrders),
      },
      {
        label: "In production",
        state: inProductionOrders && inProductionOrders > 0 ? "warning" : "healthy",
        value: formatCount(inProductionOrders),
      },
      {
        label: "Fulfilled orders",
        state: "healthy",
        value: formatCount(fulfilledOrders),
      },
      {
        label: "Credential pending items",
        state:
          credentialPendingItems && credentialPendingItems > 0 ? "warning" : "healthy",
        value: formatCount(credentialPendingItems),
      },
      {
        label: "Pending ownership records",
        state:
          ownershipPendingRecords && ownershipPendingRecords > 0
            ? "warning"
            : "healthy",
        value: formatCount(ownershipPendingRecords),
      },
    ],
    mode: "full",
    orders: orders.map((order) => ({
      checkoutReference: order.checkout_reference ?? "No checkout reference",
      createdAt: order.created_at,
      fulfillmentStatus: order.fulfillment_status,
      items: (order.order_items ?? []).map((item) => ({
        artistName: item.artists?.public_name ?? "Unknown artist",
        cardTitle: item.cards?.title ?? "Unknown card",
        itemStatus: item.status,
        ownershipStatus: item.ownership_records?.[0]?.status ?? "none",
        quantity: item.quantity,
        revealCredentialStatus:
          item.honoree_reveals?.credential_status ?? "no credential",
        revealPublicId: item.reveal_public_id,
      })),
      paymentStatus: order.payment_status,
      recipientName: order.recipient_name ?? "No recipient",
      status: order.status,
      total: formatMoney(order.total_cents),
    })),
  };
}
