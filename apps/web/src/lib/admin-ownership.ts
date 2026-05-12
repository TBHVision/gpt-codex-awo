export type OwnershipMetric = {
  label: string;
  state: "blocked" | "healthy" | "warning";
  value: string;
};

export type OwnershipRecord = {
  activatedAt: string | null;
  artistName: string;
  buyerLabel: string;
  cardTitle: string;
  checkoutReference: string;
  createdAt: string;
  fulfillmentStatus: string;
  id: string;
  itemStatus: string;
  orderItemId: string;
  metadataSummary: string;
  ownershipSummary: string;
  paymentStatus: string;
  recipientLabel: string;
  revealPublicId: string;
  status: string;
  updatedAt: string;
};

export type AdminOwnershipSnapshot = {
  generatedAt: string;
  health: OwnershipMetric[];
  mode: "full" | "limited";
  records: OwnershipRecord[];
};

type SupabaseOwnershipRecordRow = {
  activated_at: string | null;
  buyer_profile_id: string | null;
  cards?: {
    artists?: { public_name?: string } | null;
    title?: string;
  } | null;
  created_at: string;
  id: string;
  metadata: Record<string, unknown> | null;
  order_items?: {
    id?: string;
    orders?: {
      checkout_reference?: string | null;
      fulfillment_status?: string;
      payment_status?: string;
    } | null;
    reveal_public_id?: string;
    status?: string;
  } | null;
  ownership_summary: string | null;
  people?: {
    display_name?: string;
    relationship?: string | null;
  } | null;
  profiles?: {
    display_name?: string | null;
    email?: string | null;
  } | null;
  recipient_person_id: string | null;
  status: string;
  updated_at: string;
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

async function fetchOwnershipRecords(input: {
  key: string;
  supabaseUrl: string;
}) {
  const response = await fetch(
    `${input.supabaseUrl}/rest/v1/ownership_records?select=id,status,ownership_summary,activated_at,metadata,created_at,updated_at,buyer_profile_id,recipient_person_id,profiles(display_name,email),people(display_name,relationship),cards(title,artists(public_name)),order_items(id,status,reveal_public_id,orders(checkout_reference,payment_status,fulfillment_status))&order=updated_at.desc&limit=25`,
    {
      cache: "no-store",
      headers: headersFor(input.key),
    },
  );

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as SupabaseOwnershipRecordRow[];
}

function metadataSummary(metadata: Record<string, unknown> | null) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "No metadata";
  }

  const source = typeof metadata.source === "string" ? metadata.source : null;
  const orderItemStatus =
    typeof metadata.order_item_status === "string"
      ? metadata.order_item_status
      : null;
  const checkoutReference =
    typeof metadata.checkout_reference === "string"
      ? metadata.checkout_reference
      : null;

  return [source, orderItemStatus, checkoutReference]
    .filter(Boolean)
    .join(" / ") || `${Object.keys(metadata).length} metadata fields`;
}

function labelForProfile(row: SupabaseOwnershipRecordRow) {
  return (
    row.profiles?.display_name ||
    row.profiles?.email ||
    row.buyer_profile_id ||
    "No buyer profile"
  );
}

function labelForRecipient(row: SupabaseOwnershipRecordRow) {
  if (row.people?.display_name) {
    return row.people.relationship
      ? `${row.people.display_name} (${row.people.relationship})`
      : row.people.display_name;
  }

  return row.recipient_person_id ?? "No recipient person";
}

export async function loadAdminOwnershipSnapshot(): Promise<AdminOwnershipSnapshot> {
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
          label: "Ownership configuration",
          state: "blocked",
          value: `Missing ${missing.join(", ")}`,
        },
      ],
      mode: "limited",
      records: [],
    };
  }

  const [records, totalRecords, pendingRecords, activeRecords, revokedRecords] =
    await Promise.all([
      fetchOwnershipRecords({ key: serviceRoleKey, supabaseUrl }),
      fetchCount({
        key: serviceRoleKey,
        path: "/rest/v1/ownership_records?select=id",
        supabaseUrl,
      }),
      fetchCount({
        key: serviceRoleKey,
        path: "/rest/v1/ownership_records?select=id&status=eq.pending",
        supabaseUrl,
      }),
      fetchCount({
        key: serviceRoleKey,
        path: "/rest/v1/ownership_records?select=id&status=eq.active",
        supabaseUrl,
      }),
      fetchCount({
        key: serviceRoleKey,
        path: "/rest/v1/ownership_records?select=id&status=eq.revoked",
        supabaseUrl,
      }),
    ]);

  return {
    generatedAt: new Date().toISOString(),
    health: [
      {
        label: "Ownership records",
        state: "healthy",
        value: formatCount(totalRecords),
      },
      {
        label: "Pending",
        state: pendingRecords && pendingRecords > 0 ? "warning" : "healthy",
        value: formatCount(pendingRecords),
      },
      {
        label: "Active",
        state: "healthy",
        value: formatCount(activeRecords),
      },
      {
        label: "Revoked",
        state: revokedRecords && revokedRecords > 0 ? "warning" : "healthy",
        value: formatCount(revokedRecords),
      },
    ],
    mode: "full",
    records: records.map((record) => ({
      activatedAt: record.activated_at,
      artistName: record.cards?.artists?.public_name ?? "Unknown artist",
      buyerLabel: labelForProfile(record),
      cardTitle: record.cards?.title ?? "Unknown card",
      checkoutReference:
        record.order_items?.orders?.checkout_reference ?? "No checkout reference",
      createdAt: record.created_at,
      fulfillmentStatus:
        record.order_items?.orders?.fulfillment_status ?? "unknown",
      id: record.id,
      itemStatus: record.order_items?.status ?? "unknown",
      orderItemId: record.order_items?.id ?? "",
      metadataSummary: metadataSummary(record.metadata),
      ownershipSummary:
        record.ownership_summary ?? "No ownership summary has been recorded.",
      paymentStatus: record.order_items?.orders?.payment_status ?? "unknown",
      recipientLabel: labelForRecipient(record),
      revealPublicId: record.order_items?.reveal_public_id ?? "No reveal id",
      status: record.status,
      updatedAt: record.updated_at,
    })),
  };
}
