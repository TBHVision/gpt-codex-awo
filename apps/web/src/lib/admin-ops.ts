type CountResult = {
  label: string;
  state: "blocked" | "healthy" | "warning";
  value: string;
};

type RecentOrder = {
  checkout_reference: string | null;
  created_at: string;
  fulfillment_status: string;
  id: string;
  payment_status: string;
  recipient_name: string | null;
  status: string;
  total_cents: number;
};

export type AdminOpsSnapshot = {
  generatedAt: string;
  health: CountResult[];
  itemLifecycle: CountResult[];
  mode: "full" | "limited";
  orderMetrics: CountResult[];
  paymentLifecycle: CountResult[];
  recentOrders: RecentOrder[];
  revealMetrics: CountResult[];
  stuckQueues: CountResult[];
};

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return { anonKey, serviceRoleKey, supabaseUrl };
}

function headersFor(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

function formatCount(count: number | null) {
  return count === null ? "Unavailable" : count.toLocaleString("en-US");
}

function countFromContentRange(value: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
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

async function fetchRecentOrders(input: { key: string; supabaseUrl: string }) {
  const response = await fetch(
    `${input.supabaseUrl}/rest/v1/orders?select=id,checkout_reference,recipient_name,status,payment_status,fulfillment_status,total_cents,created_at&order=created_at.desc&limit=5`,
    {
      cache: "no-store",
      headers: headersFor(input.key),
    },
  );

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as RecentOrder[];
}

function missingConfigSnapshot(missing: string[]): AdminOpsSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    health: [
      {
        label: "Supabase configuration",
        state: "blocked",
        value: `Missing ${missing.join(", ")}`,
      },
    ],
    itemLifecycle: [],
    mode: "limited",
    orderMetrics: [],
    paymentLifecycle: [],
    recentOrders: [],
    revealMetrics: [],
    stuckQueues: [],
  };
}

async function fetchMetricSet(input: {
  key: string;
  metric: (state: string, count: number | null) => CountResult;
  pathFor: (state: string) => string;
  states: string[];
  supabaseUrl: string;
}) {
  const counts = await Promise.all(
    input.states.map((state) =>
      fetchCount({
        key: input.key,
        path: input.pathFor(state),
        supabaseUrl: input.supabaseUrl,
      }),
    ),
  );

  return input.states.map((state, index) => input.metric(state, counts[index]));
}

export async function loadAdminOpsSnapshot(): Promise<AdminOpsSnapshot> {
  const { anonKey, serviceRoleKey, supabaseUrl } = getSupabaseConfig();
  const missing = [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
  ].filter(Boolean) as string[];

  if (missing.length > 0 || !supabaseUrl || !anonKey) {
    return missingConfigSnapshot(missing);
  }

  const publishedCards = await fetchCount({
    key: anonKey,
    path: "/rest/v1/published_cards?select=slug",
    supabaseUrl,
  });

  if (!serviceRoleKey) {
    return {
      generatedAt: new Date().toISOString(),
      health: [
        {
          label: "Published catalog",
          state: publishedCards === null ? "warning" : "healthy",
          value: `${formatCount(publishedCards)} public cards`,
        },
        {
          label: "Sensitive ops data",
          state: "blocked",
          value: "Add SUPABASE_SERVICE_ROLE_KEY for order and reveal metrics",
        },
      ],
      mode: "limited",
      itemLifecycle: [],
      orderMetrics: [],
      paymentLifecycle: [],
      recentOrders: [],
      revealMetrics: [],
      stuckQueues: [],
    };
  }

  const staleDraftCutoff = encodeURIComponent(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  );

  const [
    orderLifecycle,
    paymentLifecycle,
    itemLifecycle,
    revealLifecycle,
    revealRows,
    pendingCards,
    staleDraftOrders,
    failedPayments,
    generationFailures,
    lockedReveals,
    recentOrders,
  ] = await Promise.all([
    fetchMetricSet({
      key: serviceRoleKey,
      metric: (state, count) => ({
        label: state.replace(/_/g, " "),
        state: state === "canceled" || state === "refunded" ? "warning" : "healthy",
        value: formatCount(count),
      }),
      pathFor: (state) => `/rest/v1/orders?select=id&status=eq.${state}`,
      states: ["draft", "pending_payment", "paid", "fulfilled", "canceled", "refunded"],
      supabaseUrl,
    }),
    fetchMetricSet({
      key: serviceRoleKey,
      metric: (state, count) => ({
        label: state.replace(/_/g, " "),
        state:
          state === "failed" || state === "partially_refunded" || state === "refunded"
            ? "warning"
            : "healthy",
        value: formatCount(count),
      }),
      pathFor: (state) => `/rest/v1/orders?select=id&payment_status=eq.${state}`,
      states: ["not_started", "pending", "paid", "failed", "partially_refunded", "refunded"],
      supabaseUrl,
    }),
    fetchMetricSet({
      key: serviceRoleKey,
      metric: (state, count) => ({
        label: state.replace(/_/g, " "),
        state:
          state === "credential_pending" || state === "canceled" || state === "refunded"
            ? "warning"
            : "healthy",
        value: formatCount(count),
      }),
      pathFor: (state) => `/rest/v1/order_items?select=id&status=eq.${state}`,
      states: [
        "reserved",
        "purchased",
        "credential_pending",
        "credential_active",
        "revealed",
        "completed",
        "canceled",
        "refunded",
      ],
      supabaseUrl,
    }),
    fetchMetricSet({
      key: serviceRoleKey,
      metric: (state, count) => ({
        label: state.replace(/_/g, " "),
        state:
          state === "locked" ||
          state === "expired" ||
          state === "revoked" ||
          state === "generation_failed"
            ? "blocked"
            : "healthy",
        value: formatCount(count),
      }),
      pathFor: (state) => `/rest/v1/honoree_reveals?select=id&credential_status=eq.${state}`,
      states: [
        "active",
        "opened",
        "completed",
        "locked",
        "expired",
        "revoked",
        "generation_failed",
      ],
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/honoree_reveals?select=id",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/cards?select=id&status=eq.pending_review",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: `/rest/v1/orders?select=id&status=eq.draft&created_at=lt.${staleDraftCutoff}`,
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/orders?select=id&payment_status=eq.failed",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/honoree_reveals?select=id&credential_status=eq.generation_failed",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/honoree_reveals?select=id&credential_status=eq.locked",
      supabaseUrl,
    }),
    fetchRecentOrders({ key: serviceRoleKey, supabaseUrl }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    health: [
      {
        label: "Published catalog",
        state: publishedCards === null ? "warning" : "healthy",
        value: `${formatCount(publishedCards)} public cards`,
      },
      {
        label: "Card approval queue",
        state: pendingCards && pendingCards > 0 ? "warning" : "healthy",
        value: `${formatCount(pendingCards)} pending`,
      },
      {
        label: "Sensitive ops data",
        state: "healthy",
        value: "Service-role read path active",
      },
    ],
    mode: "full",
    itemLifecycle,
    orderMetrics: orderLifecycle,
    paymentLifecycle,
    recentOrders,
    revealMetrics: [
      {
        label: "Reveal records",
        state: "healthy",
        value: formatCount(revealRows),
      },
      ...revealLifecycle,
    ],
    stuckQueues: [
      {
        label: "Stale draft orders",
        state: staleDraftOrders && staleDraftOrders > 0 ? "warning" : "healthy",
        value: formatCount(staleDraftOrders),
      },
      {
        label: "Failed payments",
        state: failedPayments && failedPayments > 0 ? "blocked" : "healthy",
        value: formatCount(failedPayments),
      },
      {
        label: "Credential generation failures",
        state: generationFailures && generationFailures > 0 ? "blocked" : "healthy",
        value: formatCount(generationFailures),
      },
      {
        label: "Locked reveals",
        state: lockedReveals && lockedReveals > 0 ? "blocked" : "healthy",
        value: formatCount(lockedReveals),
      },
    ],
  };
}
