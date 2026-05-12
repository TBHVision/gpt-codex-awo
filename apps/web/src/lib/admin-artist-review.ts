export type ArtistReviewAction = "approve" | "reject";

type SupabaseProfileRow = {
  role?: string;
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

async function assertNamedAdmin(input: {
  adminUserId: string | undefined;
  key: string;
  supabaseUrl: string;
}) {
  if (!input.adminUserId) {
    throw new Error("Named Supabase admin login is required for artist review actions.");
  }

  const response = await fetch(
    `${input.supabaseUrl}/rest/v1/profiles?select=role&id=eq.${input.adminUserId}&limit=1`,
    {
      cache: "no-store",
      headers: headersFor(input.key),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to verify named admin profile.");
  }

  const rows = (await response.json()) as SupabaseProfileRow[];

  if (rows[0]?.role !== "admin") {
    throw new Error("Named admin profile is not authorized.");
  }
}

export async function reviewArtist(input: {
  action: ArtistReviewAction;
  adminUserId: string | undefined;
  artistId: string;
}) {
  const { serviceRoleKey, supabaseUrl } = getConfig();

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error("Artist review actions require Supabase service-role access.");
  }

  await assertNamedAdmin({
    adminUserId: input.adminUserId,
    key: serviceRoleKey,
    supabaseUrl,
  });

  const nextStatus = input.action === "approve" ? "approved" : "rejected";
  const response = await fetch(
    `${supabaseUrl}/rest/v1/artists?id=eq.${input.artistId}&status=eq.pending_review`,
    {
      body: JSON.stringify({
        status: nextStatus,
      }),
      cache: "no-store",
      headers: {
        ...headersFor(serviceRoleKey),
        Prefer: "return=minimal",
      },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to ${input.action} artist.`);
  }

  const auditResponse = await fetch(`${supabaseUrl}/rest/v1/admin_audit_events`, {
    body: JSON.stringify({
      action: `artist_${nextStatus}`,
      actor_profile_id: input.adminUserId,
      entity_id: input.artistId,
      entity_table: "artists",
      metadata: {
        source: "admin_reviews",
      },
    }),
    cache: "no-store",
    headers: {
      ...headersFor(serviceRoleKey),
      Prefer: "return=minimal",
    },
    method: "POST",
  });

  if (!auditResponse.ok) {
    throw new Error("Artist status changed, but audit event creation failed.");
  }
}
