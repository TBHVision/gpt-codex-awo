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

export async function getPublishedCards(): Promise<CatalogResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      cards: [],
      message:
        "Supabase public environment variables are not configured for this deployment.",
      status: "not_configured",
    };
  }

  const endpoint = new URL("/rest/v1/published_cards", supabaseUrl);

  endpoint.searchParams.set(
    "select",
    [
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
    ].join(","),
  );
  endpoint.searchParams.set("order", "published_at.desc.nullslast");

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
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
