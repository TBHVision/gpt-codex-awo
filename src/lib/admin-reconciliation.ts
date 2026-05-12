export type ReconciliationIssue = {
  artistName: string;
  cardTitle: string;
  checkoutReference: string;
  detail: string;
  id: string;
  issueType: string;
  itemStatus: string;
  paymentStatus: string;
  revealPublicId: string;
  severity: "healthy" | "warning" | "blocked";
};

export type ReconciliationMetric = {
  label: string;
  state: "blocked" | "healthy" | "warning";
  value: string;
};

export type AdminReconciliationSnapshot = {
  generatedAt: string;
  issues: ReconciliationIssue[];
  metrics: ReconciliationMetric[];
  mode: "full" | "limited";
};

type SupabaseOrderItemRow = {
  cards?: {
    artists?: { public_name?: string } | null;
    title?: string;
  } | null;
  custody_events?: { event_type?: string; id: string }[] | null;
  id: string;
  orders?: {
    checkout_reference?: string | null;
    fulfillment_status?: string;
    payment_status?: string;
  } | null;
  ownership_records?: { id: string; status?: string }[] | null;
  reveal_public_id: string;
  status: string;
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

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

async function fetchOrderItems(input: { key: string; supabaseUrl: string }) {
  const response = await fetch(
    `${input.supabaseUrl}/rest/v1/order_items?select=id,status,reveal_public_id,orders(checkout_reference,payment_status,fulfillment_status),cards(title,artists(public_name)),ownership_records(id,status),custody_events(id,event_type)&order=created_at.desc&limit=100`,
    {
      cache: "no-store",
      headers: headersFor(input.key),
    },
  );

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as SupabaseOrderItemRow[];
}

function hasEvent(row: SupabaseOrderItemRow, eventType: string) {
  return (row.custody_events ?? []).some((event) => event.event_type === eventType);
}

function hasOwnership(row: SupabaseOrderItemRow) {
  return (row.ownership_records ?? []).length > 0;
}

function hasValidOwnership(row: SupabaseOrderItemRow) {
  return (row.ownership_records ?? []).some(
    (record) => record.status === "active" || record.status === "transferred",
  );
}

function hasInvalidRefundOwnership(row: SupabaseOrderItemRow) {
  return (row.ownership_records ?? []).some(
    (record) => record.status === "active" || record.status === "transferred",
  );
}

function baseIssue(
  row: SupabaseOrderItemRow,
  input: {
    detail: string;
    issueType: string;
    severity: ReconciliationIssue["severity"];
  },
): ReconciliationIssue {
  return {
    artistName: row.cards?.artists?.public_name ?? "Unknown artist",
    cardTitle: row.cards?.title ?? "Unknown card",
    checkoutReference: row.orders?.checkout_reference ?? "No checkout reference",
    detail: input.detail,
    id: `${row.id}-${input.issueType}`,
    issueType: input.issueType,
    itemStatus: row.status,
    paymentStatus: row.orders?.payment_status ?? "unknown",
    revealPublicId: row.reveal_public_id,
    severity: input.severity,
  };
}

function buildIssues(rows: SupabaseOrderItemRow[]) {
  const issues: ReconciliationIssue[] = [];

  for (const row of rows) {
    const paymentStatus = row.orders?.payment_status;
    const fulfillmentStatus = row.orders?.fulfillment_status;
    const isPaid = paymentStatus === "paid";
    const isFulfilled =
      fulfillmentStatus === "fulfilled" || row.status === "completed";

    if (isPaid && !hasOwnership(row)) {
      issues.push(
        baseIssue(row, {
          detail: "Paid order item does not have an ownership record.",
          issueType: "Missing ownership",
          severity: "blocked",
        }),
      );
    }

    if (isFulfilled && !hasValidOwnership(row)) {
      issues.push(
        baseIssue(row, {
          detail:
            "Fulfilled/completed item does not have an active or transferred ownership record.",
          issueType: "Ownership not active",
          severity: "blocked",
        }),
      );
    }

    if (hasValidOwnership(row) && !hasEvent(row, "ownership_recorded")) {
      issues.push(
        baseIssue(row, {
          detail:
            "Ownership record is active but the custody trail lacks ownership_recorded.",
          issueType: "Missing ownership event",
          severity: "warning",
        }),
      );
    }

    if (paymentStatus === "refunded" && row.status !== "refunded") {
      issues.push(
        baseIssue(row, {
          detail: "Order payment is refunded but the item is not marked refunded.",
          issueType: "Refund state mismatch",
          severity: "blocked",
        }),
      );
    }

    if (row.status === "refunded" && hasInvalidRefundOwnership(row)) {
      issues.push(
        baseIssue(row, {
          detail: "Refunded item still has active or transferred ownership.",
          issueType: "Refund ownership mismatch",
          severity: "blocked",
        }),
      );
    }

    if (isPaid && !hasEvent(row, "order_paid")) {
      issues.push(
        baseIssue(row, {
          detail: "Paid order item does not have an order_paid custody event.",
          issueType: "Missing payment event",
          severity: "warning",
        }),
      );
    }
  }

  return issues;
}

export async function loadAdminReconciliationSnapshot(): Promise<AdminReconciliationSnapshot> {
  const { serviceRoleKey, supabaseUrl } = getConfig();
  const missing = [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
  ].filter(Boolean) as string[];

  if (missing.length > 0 || !supabaseUrl || !serviceRoleKey) {
    return {
      generatedAt: new Date().toISOString(),
      issues: [],
      metrics: [
        {
          label: "Reconciliation configuration",
          state: "blocked",
          value: `Missing ${missing.join(", ")}`,
        },
      ],
      mode: "limited",
    };
  }

  const rows = await fetchOrderItems({ key: serviceRoleKey, supabaseUrl });
  const issues = buildIssues(rows);
  const blocked = issues.filter((issue) => issue.severity === "blocked").length;
  const warning = issues.filter((issue) => issue.severity === "warning").length;
  const paidItems = rows.filter((row) => row.orders?.payment_status === "paid");
  const activeOwnershipItems = rows.filter(hasValidOwnership);

  return {
    generatedAt: new Date().toISOString(),
    issues,
    metrics: [
      {
        label: "Sampled items",
        state: "healthy",
        value: formatCount(rows.length),
      },
      {
        label: "Paid items",
        state: "healthy",
        value: formatCount(paidItems.length),
      },
      {
        label: "Active ownership",
        state: "healthy",
        value: formatCount(activeOwnershipItems.length),
      },
      {
        label: "Blocked mismatches",
        state: blocked > 0 ? "blocked" : "healthy",
        value: formatCount(blocked),
      },
      {
        label: "Warning mismatches",
        state: warning > 0 ? "warning" : "healthy",
        value: formatCount(warning),
      },
    ],
    mode: "full",
  };
}
