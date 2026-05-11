"use client";

type AuthErrorResponse = {
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
};

export type BuyerSession = {
  access_token: string;
  expires_at?: number;
  refresh_token?: string;
  token_type: string;
  user: {
    email?: string;
    id: string;
  };
};

export type BuyerProfile = {
  display_name: string | null;
  email: string | null;
  id: string;
  role: "admin" | "artist" | "buyer";
};

export const buyerSessionStorageKey = "awo_buyer_session";

function getSupabasePublicConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return { anonKey, supabaseUrl };
}

function authHeaders(token?: string) {
  const { anonKey } = getSupabasePublicConfig();

  return {
    apikey: anonKey,
    Authorization: `Bearer ${token ?? anonKey}`,
    "Content-Type": "application/json",
  };
}

function errorMessage(payload: AuthErrorResponse, fallback: string) {
  return (
    payload.error_description ??
    payload.msg ??
    payload.message ??
    payload.error ??
    fallback
  );
}

async function parseAuthResponse(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as
    | AuthErrorResponse
    | BuyerSession;

  if (!response.ok) {
    throw new Error(errorMessage(payload as AuthErrorResponse, fallback));
  }

  return payload as BuyerSession;
}

export async function signUpBuyer(input: {
  displayName?: string;
  email: string;
  password: string;
}) {
  const { supabaseUrl } = getSupabasePublicConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      data: {
        display_name: input.displayName?.trim() || null,
      },
    }),
    headers: authHeaders(),
    method: "POST",
  });

  return parseAuthResponse(response, "Could not create the buyer account.");
}

export async function signInBuyer(input: { email: string; password: string }) {
  const { supabaseUrl } = getSupabasePublicConfig();

  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      body: JSON.stringify({
        email: input.email,
        password: input.password,
      }),
      headers: authHeaders(),
      method: "POST",
    },
  );

  return parseAuthResponse(response, "Could not sign in to the buyer account.");
}

export async function fetchBuyerProfile(session: BuyerSession) {
  const { supabaseUrl } = getSupabasePublicConfig();

  const response = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=id,email,display_name,role&id=eq.${session.user.id}`,
    {
      headers: authHeaders(session.access_token),
    },
  );

  const payload = (await response.json().catch(() => [])) as
    | AuthErrorResponse
    | BuyerProfile[];

  if (!response.ok) {
    throw new Error(
      errorMessage(payload as AuthErrorResponse, "Could not load buyer profile."),
    );
  }

  return Array.isArray(payload) ? payload[0] ?? null : null;
}

export function readBuyerSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(buyerSessionStorageKey);
    return raw ? (JSON.parse(raw) as BuyerSession) : null;
  } catch {
    return null;
  }
}

export function saveBuyerSession(session: BuyerSession) {
  window.localStorage.setItem(buyerSessionStorageKey, JSON.stringify(session));
}

export function clearBuyerSession() {
  window.localStorage.removeItem(buyerSessionStorageKey);
}
