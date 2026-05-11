export type PublicArtist = {
  bio: string | null;
  focus: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
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
