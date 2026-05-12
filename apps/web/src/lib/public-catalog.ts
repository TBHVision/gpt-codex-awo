export type PublishedCard = {
  id: string;
  artist_id: string;
  artist_name: string;
  artist_slug: string;
  title: string;
  slug: string;
  description: string | null;
  occasion_tags: string[];
  recipient_tags: string[];
  price_cents: number;
  currency: string;
  cover_media_url: string | null;
  published_at: string | null;
};

export type CatalogResult =
  | { cards: PublishedCard[]; status: "ready" }
  | { cards: []; message: string; status: "not_configured" | "error" };

const publishedCardSelect = [
  "id",
  "artist_id",
  "artist_name",
  "artist_slug",
  "title",
  "slug",
  "description",
  "occasion_tags",
  "recipient_tags",
  "price_cents",
  "currency",
  "cover_media_url",
  "published_at",
].join(",");

type SupabasePublicConfig =
  | { anonKey: string; status: "ready"; supabaseUrl: string }
  | { missing: string[]; status: "missing" };

function getSupabasePublicConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing = [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0) {
    return { missing, status: "missing" } satisfies SupabasePublicConfig;
  }

  return {
    anonKey: anonKey as string,
    status: "ready",
    supabaseUrl: supabaseUrl as string,
  } satisfies SupabasePublicConfig;
}

export async function getPublishedCards(): Promise<CatalogResult> {
  const config = getSupabasePublicConfig();

  if (config.status === "missing") {
    return {
      cards: [],
      message: `Missing Vercel environment variable: ${config.missing.join(", ")}.`,
      status: "not_configured",
    };
  }

  const endpoint = new URL("/rest/v1/published_cards", config.supabaseUrl);

  endpoint.searchParams.set("select", publishedCardSelect);
  endpoint.searchParams.set("order", "published_at.desc.nullslast");

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        cards: [],
        message: `Supabase catalog request failed with HTTP ${response.status}.`,
        status: "error",
      };
    }

    const cards = (await response.json()) as PublishedCard[];

    return { cards, status: "ready" };
  } catch {
    return {
      cards: [],
      message: "Supabase catalog request failed before a response was returned.",
      status: "error",
    };
  }
}

export type CardResult =
  | { card: PublishedCard; status: "ready" }
  | {
      card: null;
      message: string;
      status: "not_configured" | "not_found" | "error";
    };

export async function getPublishedCardBySlug(
  slug: string,
): Promise<CardResult> {
  const config = getSupabasePublicConfig();

  if (config.status === "missing") {
    return {
      card: null,
      message: `Missing Vercel environment variable: ${config.missing.join(", ")}.`,
      status: "not_configured",
    };
  }

  const endpoint = new URL("/rest/v1/published_cards", config.supabaseUrl);

  endpoint.searchParams.set("select", publishedCardSelect);
  endpoint.searchParams.set("slug", `eq.${slug}`);
  endpoint.searchParams.set("limit", "1");

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        card: null,
        message: `Supabase card request failed with HTTP ${response.status}.`,
        status: "error",
      };
    }

    const cards = (await response.json()) as PublishedCard[];
    const card = cards[0];

    if (!card) {
      return {
        card: null,
        message: "This card is not published or does not exist.",
        status: "not_found",
      };
    }

    return { card, status: "ready" };
  } catch {
    return {
      card: null,
      message: "Supabase card request failed before a response was returned.",
      status: "error",
    };
  }
}

export async function getPublishedCardsByArtistSlug(
  artistSlug: string,
): Promise<CatalogResult> {
  const config = getSupabasePublicConfig();

  if (config.status === "missing") {
    return {
      cards: [],
      message: `Missing Vercel environment variable: ${config.missing.join(", ")}.`,
      status: "not_configured",
    };
  }

  const endpoint = new URL("/rest/v1/published_cards", config.supabaseUrl);

  endpoint.searchParams.set("select", publishedCardSelect);
  endpoint.searchParams.set("artist_slug", `eq.${artistSlug}`);
  endpoint.searchParams.set("order", "published_at.desc.nullslast");

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        cards: [],
        message: `Supabase artist catalog request failed with HTTP ${response.status}.`,
        status: "error",
      };
    }

    const cards = (await response.json()) as PublishedCard[];

    return { cards, status: "ready" };
  } catch {
    return {
      cards: [],
      message: "Supabase artist catalog request failed before a response was returned.",
      status: "error",
    };
  }
}
