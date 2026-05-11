type SupabaseTokenResponse = {
  access_token?: string;
  user?: {
    id?: string;
  };
};

type SupabaseProfileRow = {
  role?: string;
};

export type AdminAuthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "bad_credentials" | "missing_config" | "not_admin" };

function getSupabaseAuthConfig() {
  return {
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };
}

export function canUseSupabaseAdminLogin() {
  const { anonKey, supabaseUrl } = getSupabaseAuthConfig();

  return Boolean(anonKey?.trim() && supabaseUrl?.trim());
}

export async function verifySupabaseAdminLogin(input: {
  email: string;
  password: string;
}): Promise<AdminAuthResult> {
  const { anonKey, supabaseUrl } = getSupabaseAuthConfig();

  if (!anonKey || !supabaseUrl) {
    return { ok: false, reason: "missing_config" };
  }

  const tokenResponse = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      body: JSON.stringify({
        email: input.email,
        password: input.password,
      }),
      cache: "no-store",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!tokenResponse.ok) {
    return { ok: false, reason: "bad_credentials" };
  }

  const tokenPayload = (await tokenResponse.json()) as SupabaseTokenResponse;
  const accessToken = tokenPayload.access_token;
  const userId = tokenPayload.user?.id;

  if (!accessToken || !userId) {
    return { ok: false, reason: "bad_credentials" };
  }

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=role&id=eq.${userId}&limit=1`,
    {
      cache: "no-store",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!profileResponse.ok) {
    return { ok: false, reason: "not_admin" };
  }

  const profiles = (await profileResponse.json()) as SupabaseProfileRow[];
  const profile = profiles[0];

  return profile?.role === "admin"
    ? { ok: true, userId }
    : { ok: false, reason: "not_admin" };
}
