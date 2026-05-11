"use client";

import type { BuyerSession } from "@/lib/buyer-auth";

export type ArtistStudioProfile = {
  artistId: string | null;
  artistName: string | null;
  role: "admin" | "artist" | "buyer";
};

export type StudioDraftRecord = {
  id: string;
  category: string;
  provenanceChecklist: string[];
  status: string;
  title: string;
};

type RestError = {
  message?: string;
};

function getSupabasePublicConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return { anonKey, supabaseUrl };
}

function headersFor(session: BuyerSession, preferRepresentation = false) {
  const { anonKey } = getSupabasePublicConfig();

  return {
    apikey: anonKey,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
    ...(preferRepresentation ? { Prefer: "return=representation" } : {}),
  };
}

async function parseResponse<T>(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as T | RestError | null;

  if (!response.ok) {
    throw new Error(
      payload && typeof payload === "object" && "message" in payload
        ? payload.message || fallback
        : fallback,
    );
  }

  return payload as T;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function fetchArtistStudioProfile(session: BuyerSession) {
  const { supabaseUrl } = getSupabasePublicConfig();

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=id,role&id=eq.${session.user.id}`,
    {
      headers: headersFor(session),
    },
  );
  const [profile] = await parseResponse<Array<{ id: string; role: ArtistStudioProfile["role"] }>>(
    profileResponse,
    "Could not load studio profile.",
  );

  if (!profile || (profile.role !== "artist" && profile.role !== "admin")) {
    return {
      artistId: null,
      artistName: null,
      role: profile?.role ?? "buyer",
    } satisfies ArtistStudioProfile;
  }

  const artistQuery =
    profile.role === "artist"
      ? `profile_id=eq.${session.user.id}`
      : "status=eq.approved";

  const artistResponse = await fetch(
    `${supabaseUrl}/rest/v1/artists?select=id,public_name&${artistQuery}&order=created_at.asc&limit=1`,
    {
      headers: headersFor(session),
    },
  );
  const [artist] = await parseResponse<Array<{ id: string; public_name: string }>>(
    artistResponse,
    "Could not load artist workspace.",
  );

  return {
    artistId: artist?.id ?? null,
    artistName: artist?.public_name ?? null,
    role: profile.role,
  } satisfies ArtistStudioProfile;
}

export async function fetchStudioDrafts(
  session: BuyerSession,
  artistId: string,
) {
  const { supabaseUrl } = getSupabasePublicConfig();

  const response = await fetch(
    `${supabaseUrl}/rest/v1/cards?select=id,title,status,occasion_tags,provenance_checklist&artist_id=eq.${artistId}&order=created_at.asc`,
    {
      headers: headersFor(session),
    },
  );

  const cards = await parseResponse<
    Array<{
      id: string;
      occasion_tags: string[];
      provenance_checklist: string[];
      status: string;
      title: string;
    }>
  >(response, "Could not load studio drafts.");

  return cards.map<StudioDraftRecord>((card) => ({
    category: card.occasion_tags[0] ?? "Originals",
    id: card.id,
    provenanceChecklist: card.provenance_checklist ?? [],
    status: card.status,
    title: card.title,
  }));
}

export async function createStudioDraft(
  session: BuyerSession,
  input: {
    artistId: string;
    category: string;
    checklist: string[];
    title: string;
  },
) {
  const { supabaseUrl } = getSupabasePublicConfig();
  const uniqueSlug = `${slugify(input.title)}-${Date.now().toString(36)}`;

  const response = await fetch(`${supabaseUrl}/rest/v1/cards`, {
    body: JSON.stringify({
      artist_id: input.artistId,
      currency: "USD",
      description: "Studio draft created from the AWO artist workspace.",
      occasion_tags: [input.category],
      price_cents: 599,
      provenance_checklist: input.checklist,
      recipient_tags: [],
      slug: uniqueSlug,
      status: "draft",
      title: input.title,
    }),
    headers: headersFor(session, true),
    method: "POST",
  });

  const [card] = await parseResponse<
    Array<{
      id: string;
      occasion_tags: string[];
      provenance_checklist: string[];
      status: string;
      title: string;
    }>
  >(response, "Could not create studio draft.");

  return {
    category: card.occasion_tags[0] ?? input.category,
    id: card.id,
    provenanceChecklist: card.provenance_checklist ?? [],
    status: card.status,
    title: card.title,
  } satisfies StudioDraftRecord;
}

export async function updateStudioDraftChecklist(
  session: BuyerSession,
  input: {
    checklist: string[];
    draftId: string;
  },
) {
  const { supabaseUrl } = getSupabasePublicConfig();

  const response = await fetch(
    `${supabaseUrl}/rest/v1/cards?id=eq.${input.draftId}`,
    {
      body: JSON.stringify({
        provenance_checklist: input.checklist,
      }),
      headers: headersFor(session, true),
      method: "PATCH",
    },
  );

  const [card] = await parseResponse<
    Array<{
      id: string;
      occasion_tags: string[];
      provenance_checklist: string[];
      status: string;
      title: string;
    }>
  >(response, "Could not update draft checklist.");

  return {
    category: card.occasion_tags[0] ?? "Originals",
    id: card.id,
    provenanceChecklist: card.provenance_checklist ?? [],
    status: card.status,
    title: card.title,
  } satisfies StudioDraftRecord;
}
