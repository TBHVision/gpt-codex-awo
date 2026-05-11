type CountResult = {
  label: string;
  state: "blocked" | "healthy" | "warning";
  value: string;
};

type RecentOrder = {
  checkout_reference: string | null;
  created_at: string;
  id: string;
  recipient_name: string | null;
  status: string;
  total_cents: number;
};

export type AdminOpsSnapshot = {
  generatedAt: string;
  health: CountResult[];
  mode: "full" | "limited";
  orderMetrics: CountResult[];
  recentOrders: RecentOrder[];
  revealMetrics: CountResult[];
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
    `${input.supabaseUrl}/rest/v1/orders?select=id,checkout_reference,recipient_name,status,total_cents,created_at&order=created_at.desc&limit=5`,
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
    mode: "limited",
    orderMetrics: [],
    recentOrders: [],
    revealMetrics: [],
  };
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
      orderMetrics: [],
      recentOrders: [],
      revealMetrics: [],
    };
  }

  const [
    draftOrders,
    paidOrders,
    totalOrders,
    revealRows,
    pendingCards,
    recentOrders,
  ] = await Promise.all([
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/orders?select=id&status=eq.draft",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/orders?select=id&status=eq.paid",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/orders?select=id",
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
    orderMetrics: [
      {
        label: "Total orders",
        state: "healthy",
        value: formatCount(totalOrders),
      },
      {
        label: "Draft orders",
        state: draftOrders && draftOrders > 0 ? "warning" : "healthy",
        value: formatCount(draftOrders),
      },
      {
        label: "Paid orders",
        state: "healthy",
        value: formatCount(paidOrders),
      },
    ],
    recentOrders,
    revealMetrics: [
      {
        label: "Reveal records",
        state: "healthy",
        value: formatCount(revealRows),
      },
    ],
  };
}
