import Link from "next/link";
import StorefrontNav from "@/app/components/StorefrontNav";
import { fetchPublicArtists } from "@/lib/public-artists";

const fallbackArtists = [
  {
    bio: "Seeded demo profile showing how AWO presents a human-made origin story, published card inventory, and the proof layer behind each reveal.",
    focus: "Verified demo artist",
    name: "HatchVision Studio",
    slug: "hatchvision-studio",
    websiteUrl: "https://hatchvision.com",
  },
];

function ArtistMark({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,#d9a16f_0,#9a5f38_45%,#5a311b_100%)] text-2xl font-black text-white shadow-[inset_0_0_0_4px_rgba(255,255,255,.22)]">
      {initials}
    </div>
  );
}

export default async function ArtistsPage() {
  const artists = await fetchPublicArtists();
  const visibleArtists = artists.length > 0 ? artists : fallbackArtists;

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="artists" />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_45%,#f4f0ea_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
            Artist provenance
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
            Human creation is the point.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#4b4743]">
            Approved artist profiles now load from Supabase. AWO uses these
            records as the public face of origin, story, and studio trust.
          </p>
          <Link
            className="mt-7 inline-flex h-12 items-center justify-center bg-[#252525] px-6 text-sm font-black uppercase tracking-wide text-white hover:bg-[#3a3632]"
            href="/studio"
          >
            Open Artist Studio
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="grid gap-5 md:grid-cols-2">
          {visibleArtists.map((artist) => (
            <article
              className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]"
              key={artist.slug}
            >
              <div className="flex flex-col gap-5 sm:flex-row">
                <ArtistMark name={artist.name} />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                    {artist.focus}
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    <Link
                      className="hover:text-[#a85f38]"
                      href={`/artists/${artist.slug}`}
                    >
                      {artist.name}
                    </Link>
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#4b4743]">
                    {artist.bio}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      className="inline-flex text-sm font-black uppercase tracking-wide text-[#7a472e]"
                      href={`/artists/${artist.slug}`}
                    >
                      View Artist Story
                    </Link>
                    {artist.websiteUrl ? (
                      <a
                        className="inline-flex text-sm font-black uppercase tracking-wide text-[#7a472e]"
                        href={artist.websiteUrl}
                      >
                        Artist Website
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
