export type VerifiedBuyerSession = {
  email: string | null;
  id: string;
};

type SupabasePublicConfig = {
  anonKey: string;
  supabaseUrl: string;
};

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

export async function verifyBuyerAccessToken(
  config: SupabasePublicConfig,
  accessToken: string | undefined,
): Promise<VerifiedBuyerSession | null> {
  const token = String(accessToken || "").trim();

  if (!token) {
    return null;
  }

  const endpoint = new URL("/auth/v1/user", config.supabaseUrl);
  const response = await fetch(endpoint, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as {
    email?: string | null;
    id?: string;
  };

  if (!user.id) {
    return null;
  }

  return {
    email: user.email ?? null,
    id: user.id,
  };
}

export async function attachOrderToBuyer(
  config: SupabasePublicConfig,
  orderId: string,
  buyerProfileId: string,
) {
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!serviceRoleKey || !orderId || !buyerProfileId) {
    return false;
  }

  const endpoint = new URL("/rest/v1/orders", config.supabaseUrl);
  endpoint.searchParams.set("id", `eq.${orderId}`);

  const response = await fetch(endpoint, {
    body: JSON.stringify({ buyer_profile_id: buyerProfileId }),
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    method: "PATCH",
  });

  return response.ok;
}
