export type CustodyMetric = {
  label: string;
  state: "blocked" | "healthy" | "warning";
  value: string;
};

export type CustodyEvent = {
  actorLabel: string;
  artistName: string;
  cardTitle: string;
  checkoutReference: string;
  createdAt: string;
  eventPayloadSummary: string;
  eventType: string;
  fulfillmentStatus: string;
  id: string;
  itemStatus: string;
  occurredAt: string;
  paymentStatus: string;
  revealPublicId: string;
};

export type AdminCustodySnapshot = {
  events: CustodyEvent[];
  generatedAt: string;
  health: CustodyMetric[];
  mode: "full" | "limited";
};

type SupabaseCustodyEventRow = {
  actor_profile_id: string | null;
  cards?: {
    artists?: { public_name?: string } | null;
    title?: string;
  } | null;
  created_at: string;
  event_payload: Record<string, unknown> | null;
  event_type: string;
  id: string;
  occurred_at: string;
  order_items?: {
    orders?: {
      checkout_reference?: string | null;
      fulfillment_status?: string;
      payment_status?: string;
    } | null;
    reveal_public_id?: string;
    status?: string;
  } | null;
  profiles?: {
    display_name?: string | null;
    email?: string | null;
  } | null;
};

const keyEventTypes = [
  "order_paid",
  "credential_activated",
  "item_fulfilled",
  "ownership_recorded",
] as const;

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

async function fetchCustodyEvents(input: { key: string; supabaseUrl: string }) {
  const response = await fetch(
    `${input.supabaseUrl}/rest/v1/custody_events?select=id,event_type,event_payload,occurred_at,created_at,actor_profile_id,profiles(display_name,email),cards(title,artists(public_name)),order_items(status,reveal_public_id,orders(checkout_reference,payment_status,fulfillment_status))&order=occurred_at.desc&limit=30`,
    {
      cache: "no-store",
      headers: headersFor(input.key),
    },
  );

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as SupabaseCustodyEventRow[];
}

function actorLabel(row: SupabaseCustodyEventRow) {
  return (
    row.profiles?.display_name ||
    row.profiles?.email ||
    row.actor_profile_id ||
    "System"
  );
}

function payloadSummary(payload: Record<string, unknown> | null) {
  if (!payload || Object.keys(payload).length === 0) {
    return "No payload";
  }

  const values = [
    typeof payload.source === "string" ? payload.source : null,
    typeof payload.checkout_reference === "string"
      ? payload.checkout_reference
      : null,
    typeof payload.status === "string" ? payload.status : null,
    typeof payload.next_status === "string" ? payload.next_status : null,
  ].filter(Boolean);

  return values.join(" / ") || `${Object.keys(payload).length} payload fields`;
}

export async function loadAdminCustodySnapshot(): Promise<AdminCustodySnapshot> {
  const { serviceRoleKey, supabaseUrl } = getConfig();
  const missing = [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
  ].filter(Boolean) as string[];

  if (missing.length > 0 || !supabaseUrl || !serviceRoleKey) {
    return {
      events: [],
      generatedAt: new Date().toISOString(),
      health: [
        {
          label: "Custody configuration",
          state: "blocked",
          value: `Missing ${missing.join(", ")}`,
        },
      ],
      mode: "limited",
    };
  }

  const [events, totalEvents, ...keyCounts] = await Promise.all([
    fetchCustodyEvents({ key: serviceRoleKey, supabaseUrl }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/custody_events?select=id",
      supabaseUrl,
    }),
    ...keyEventTypes.map((eventType) =>
      fetchCount({
        key: serviceRoleKey,
        path: `/rest/v1/custody_events?select=id&event_type=eq.${eventType}`,
        supabaseUrl,
      }),
    ),
  ]);

  return {
    events: events.map((event) => ({
      actorLabel: actorLabel(event),
      artistName: event.cards?.artists?.public_name ?? "Unknown artist",
      cardTitle: event.cards?.title ?? "Unknown card",
      checkoutReference:
        event.order_items?.orders?.checkout_reference ?? "No checkout reference",
      createdAt: event.created_at,
      eventPayloadSummary: payloadSummary(event.event_payload),
      eventType: event.event_type,
      fulfillmentStatus:
        event.order_items?.orders?.fulfillment_status ?? "unknown",
      id: event.id,
      itemStatus: event.order_items?.status ?? "unknown",
      occurredAt: event.occurred_at,
      paymentStatus: event.order_items?.orders?.payment_status ?? "unknown",
      revealPublicId: event.order_items?.reveal_public_id ?? "No reveal id",
    })),
    generatedAt: new Date().toISOString(),
    health: [
      {
        label: "Custody events",
        state: "healthy",
        value: formatCount(totalEvents),
      },
      ...keyEventTypes.map((eventType, index) => ({
        label: eventType.replace(/_/g, " "),
        state: "healthy" as const,
        value: formatCount(keyCounts[index] ?? null),
      })),
    ],
    mode: "full",
  };
}
