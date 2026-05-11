export type AdminAuditEvent = {
  action: string;
  actorProfileId: string | null;
  createdAt: string;
  entityId: string | null;
  entityTable: string;
  id: string;
  metadata: Record<string, unknown>;
};

export type AdminAuditSnapshot = {
  events: AdminAuditEvent[];
  generatedAt: string;
  health: {
    label: string;
    state: "blocked" | "healthy" | "warning";
    value: string;
  }[];
  mode: "full" | "limited";
};

type SupabaseAuditRow = {
  action: string;
  actor_profile_id: string | null;
  created_at: string;
  entity_id: string | null;
  entity_table: string;
  id: string;
  metadata: Record<string, unknown>;
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

async function fetchAuditEvents(input: { key: string; supabaseUrl: string }) {
  const response = await fetch(
    `${input.supabaseUrl}/rest/v1/admin_audit_events?select=id,actor_profile_id,action,entity_table,entity_id,metadata,created_at&order=created_at.desc&limit=25`,
    {
      cache: "no-store",
      headers: headersFor(input.key),
    },
  );

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as SupabaseAuditRow[];
}

export async function loadAdminAuditSnapshot(): Promise<AdminAuditSnapshot> {
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
          label: "Audit configuration",
          state: "blocked",
          value: `Missing ${missing.join(", ")}`,
        },
      ],
      mode: "limited",
    };
  }

  const [events, totalEvents, recentCardReviews] = await Promise.all([
    fetchAuditEvents({ key: serviceRoleKey, supabaseUrl }),
    fetchCount({
      key: serviceRoleKey,
      path: "/rest/v1/admin_audit_events?select=id",
      supabaseUrl,
    }),
    fetchCount({
      key: serviceRoleKey,
      path:
        "/rest/v1/admin_audit_events?select=id&entity_table=eq.cards&action=in.(card_approved,card_rejected)",
      supabaseUrl,
    }),
  ]);

  return {
    events: events.map((event) => ({
      action: event.action,
      actorProfileId: event.actor_profile_id,
      createdAt: event.created_at,
      entityId: event.entity_id,
      entityTable: event.entity_table,
      id: event.id,
      metadata: event.metadata ?? {},
    })),
    generatedAt: new Date().toISOString(),
    health: [
      {
        label: "Total audit events",
        state: "healthy",
        value: formatCount(totalEvents),
      },
      {
        label: "Card review events",
        state: "healthy",
        value: formatCount(recentCardReviews),
      },
    ],
    mode: "full",
  };
}
