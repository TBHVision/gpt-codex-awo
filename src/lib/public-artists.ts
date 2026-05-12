export type PublicArtist = {
  bio: string | null;
  focus: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
};

export type ArtistResult =
  | { artist: PublicArtist; status: "ready" }
  | {
      artist: null;
      message: string;
      status: "not_configured" | "not_found" | "error";
    };

function getSupabasePublicConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return { anonKey, supabaseUrl };
}

export async function fetchPublicArtists(): Promise<PublicArtist[]> {
  const config = getSupabasePublicConfig();

  if (!config) {
    return [];
  }

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/artists?select=public_name,slug,bio,website_url&status=eq.approved&order=public_name.asc`,
    {
      cache: "no-store",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    },
  );

  if (!response.ok) {
    return [];
  }

  const artists = (await response.json()) as Array<{
    bio: string | null;
    public_name: string;
    slug: string;
    website_url: string | null;
  }>;

  return artists.map((artist) => ({
    bio: artist.bio,
    focus: "Verified AWO artist",
    name: artist.public_name,
    slug: artist.slug,
    websiteUrl: artist.website_url,
  }));
}

export async function fetchPublicArtistBySlug(
  slug: string,
): Promise<ArtistResult> {
  const config = getSupabasePublicConfig();

  if (!config) {
    return {
      artist: null,
      message: "Supabase public environment variables are not configured.",
      status: "not_configured",
    };
  }

  try {
    const endpoint = new URL("/rest/v1/artists", config.supabaseUrl);
    endpoint.searchParams.set("select", "public_name,slug,bio,website_url");
    endpoint.searchParams.set("status", "eq.approved");
    endpoint.searchParams.set("slug", `eq.${slug}`);
    endpoint.searchParams.set("limit", "1");

    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });

    if (!response.ok) {
      return {
        artist: null,
        message: `Supabase artist request failed with HTTP ${response.status}.`,
        status: "error",
      };
    }

    const artists = (await response.json()) as Array<{
      bio: string | null;
      public_name: string;
      slug: string;
      website_url: string | null;
    }>;
    const artist = artists[0];

    if (!artist) {
      return {
        artist: null,
        message: "This artist is not approved or does not exist.",
        status: "not_found",
      };
    }

    return {
      artist: {
        bio: artist.bio,
        focus: "Verified AWO artist",
        name: artist.public_name,
        slug: artist.slug,
        websiteUrl: artist.website_url,
      },
      status: "ready",
    };
  } catch {
    return {
      artist: null,
      message: "Supabase artist request failed before a response was returned.",
      status: "error",
    };
  }
}
