type QueueState = "blocked" | "healthy" | "warning";

export type ReviewMetric = {
  label: string;
  state: QueueState;
  value: string;
};

export type ReviewCard = {
  artist: string;
  createdAt: string;
  id: string;
  price: string;
  slug: string;
  status: string;
  title: string;
  updatedAt: string;
};

export type ReviewArtist = {
  createdAt: string;
  id: string;
  name: string;
  slug: string;
  status: string;
  updatedAt: string;
};

export type ReviewOrder = {
  checkoutReference: string;
  createdAt: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  recipientName: string;
  status: string;
  total: string;
};

export type ReviewReveal = {
  cardTitle: string;
  credentialStatus: string;
  failedAttempts: number;
  revealPublicId: string;
  status: string;
  updatedAt: string;
};

export type AdminReviewQueuesSnapshot = {
  cards: ReviewCard[];
  cardStatus: ReviewMetric[];
  generatedAt: string;
  artists: ReviewArtist[];
  artistStatus: ReviewMetric[];
  health: ReviewMetric[];
  mode: "full" | "limited";
  orders: ReviewOrder[];
  reveals: ReviewReveal[];
};

type SupabaseCardRow = {
  artists?: { public_name?: string } | null;
  created_at: string;
  id: string;
  price_cents: number;
  slug: string;
  status: string;
  title: string;
  updated_at: string;
};

type SupabaseArtistRow = {
  created_at: string;
  id: string;
  public_name: string;
  slug: string;
  status: string;
  updated_at: string;
};

type SupabaseOrderRow = {
  checkout_reference: string | null;
  created_at: string;
  fulfillment_status: string;
  payment_status: string;
  recipient_name: string | null;
  status: string;
  total_cents: number;
};

type SupabaseRevealRow = {
  credential_status: string;
  failed_attempts: number;
  order_items?: {
    cards?: { title?: string } | null;
    reveal_public_id?: string;
  } | null;
  status: string;
  updated_at: string;
};

function getSupabaseConfig() {
  return {
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

async function fetchRows<T>(input: {
  key: string;
  path: string;
  supabaseUrl: string;
}) {
  const response = await fetch(`${input.supabaseUrl}${input.path}`, {
    cache: "no-store",
    headers: headersFor(input.key),
  });

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as T[];
}

async function fetchMetricSet(input: {
  key: string;
  pathFor: (status: string) => string;
  states: string[];
  stateFor: (status: string, count: number | null) => QueueState;
  supabaseUrl: string;
}) {
  const counts = await Promise.all(
    input.states.map((status) =>
      fetchCount({
        key: input.key,
        path: input.pathFor(status),
        supabaseUrl: input.supabaseUrl,
      }),
    ),
  );

  return input.states.map((status, index) => ({
    label: status.replace(/_/g, " "),
    state: input.stateFor(status, counts[index]),
    value: formatCount(counts[index]),
  }));
}

function missingConfigSnapshot(missing: string[]): AdminReviewQueuesSnapshot {
  return {
    artistStatus: [],
    artists: [],
    cards: [],
    cardStatus: [],
    generatedAt: new Date().toISOString(),
    health: [
      {
        label: "Review queue configuration",
        state: "blocked",
        value: `Missing ${missing.join(", ")}`,
      },
    ],
    mode: "limited",
    orders: [],
    reveals: [],
  };
}

export async function loadAdminReviewQueues(): Promise<AdminReviewQueuesSnapshot> {
  const { serviceRoleKey, supabaseUrl } = getSupabaseConfig();
  const missing = [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
  ].filter(Boolean) as string[];

  if (missing.length > 0 || !supabaseUrl || !serviceRoleKey) {
    return missingConfigSnapshot(missing);
  }

  const [
    cardStatus,
    artistStatus,
    cards,
    artists,
    orders,
    reveals,
    pendingCards,
    pendingArtists,
    failedPayments,
    lockedReveals,
  ] = await Promise.all([
    fetchMetricSet({
      key: serviceRoleKey,
      pathFor: (status) => `/rest/v1/cards?select=id&status=eq.${status}`,
      stateFor: (status, count) =>
        status === "pending_review" && count && count > 0 ? "warning" : "healthy",
      states: ["draft", "pending_review", "approved", "published", "rejected", "retired"],
      supabaseUrl,
    }),
    fetchMetricSet({
      key: serviceRoleKey,
      pathFor: (status) => `/rest/v1/artists?select=id&status=eq.${status}`,
      stateFor: (status, count) =>
        status === "pending_review" && count && count > 0 ? "warning" : "healthy",
      states: ["draft", "pending_review", "approved", "rejected", "suspended"],
      supabaseUrl,
    }),
    fetchRows<SupabaseCardRow>({
      key: serviceRoleKey,
      path:
        "/rest/v1/cards?select=id,title,slug,status,price_cents,created_at,updated_at,artists(public_name)&order=updated_at.desc&limit=12",
      supabaseUrl,
    }),
    fetchRows<SupabaseArtistRow>({
      key: serviceRoleKey,
      path:
        "/rest/v1/artists?select=id,public_name,slug,status,created_at,updated_at&order=updated_at.desc&limit=8",
      supabaseUrl,
    }),
    fetchRows<SupabaseOrderRow>({
      key: serviceRoleKey,
      path:
        "/rest/v1/orders?select=checkout_reference,recipient_name,status,payment_status,fulfillment_status,total_cents,created_at&order=created_at.desc&limit=8",
      supabaseUrl,
    }),
    fetchRows<SupabaseRevealRow>({
      key: serviceRoleKey,
      path:
        "/rest/v1/honoree_reveals?select=status,credential_status,failed_attempts,updated_at,order_items(reveal_public_id,cards(title))&order=updated_at.desc&limit=8",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/cards?select=id&status=eq.pending_review",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/artists?select=id&status=eq.pending_review",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/orders?select=id&payment_status=eq.failed",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/honoree_reveals?select=id&credential_status=eq.locked",
      supabaseUrl,
    }),
  ]);

  return {
    artistStatus,
    artists: artists.map((artist) => ({
      createdAt: artist.created_at,
      id: artist.id,
      name: artist.public_name,
      slug: artist.slug,
      status: artist.status,
      updatedAt: artist.updated_at,
    })),
    cards: cards.map((card) => ({
      artist: card.artists?.public_name ?? "Unknown artist",
      createdAt: card.created_at,
      id: card.id,
      price: formatMoney(card.price_cents),
      slug: card.slug,
      status: card.status,
      title: card.title,
      updatedAt: card.updated_at,
    })),
    cardStatus,
    generatedAt: new Date().toISOString(),
    health: [
      {
        label: "Pending cards",
        state: pendingCards && pendingCards > 0 ? "warning" : "healthy",
        value: formatCount(pendingCards),
      },
      {
        label: "Pending artists",
        state: pendingArtists && pendingArtists > 0 ? "warning" : "healthy",
        value: formatCount(pendingArtists),
      },
      {
        label: "Failed payments",
        state: failedPayments && failedPayments > 0 ? "blocked" : "healthy",
        value: formatCount(failedPayments),
      },
      {
        label: "Locked reveals",
        state: lockedReveals && lockedReveals > 0 ? "blocked" : "healthy",
        value: formatCount(lockedReveals),
      },
    ],
    mode: "full",
    orders: orders.map((order) => ({
      checkoutReference: order.checkout_reference ?? "No checkout reference",
      createdAt: order.created_at,
      fulfillmentStatus: order.fulfillment_status,
      paymentStatus: order.payment_status,
      recipientName: order.recipient_name ?? "No recipient",
      status: order.status,
      total: formatMoney(order.total_cents),
    })),
    reveals: reveals.map((reveal) => ({
      cardTitle: reveal.order_items?.cards?.title ?? "Unknown card",
      credentialStatus: reveal.credential_status,
      failedAttempts: reveal.failed_attempts,
      revealPublicId: reveal.order_items?.reveal_public_id ?? "No reveal code",
      status: reveal.status,
      updatedAt: reveal.updated_at,
    })),
  };
}
