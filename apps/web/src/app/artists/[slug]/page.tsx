import Link from "next/link";
import { notFound } from "next/navigation";
import StorefrontNav from "@/app/components/StorefrontNav";
import { getPublishedCardsByArtistSlug } from "@/lib/public-catalog";
import { fetchPublicArtistBySlug } from "@/lib/public-artists";

function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(cents / 100);
}

function ArtistMark({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex size-28 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,#d9a16f_0,#9a5f38_45%,#5a311b_100%)] text-3xl font-black text-white shadow-[inset_0_0_0_4px_rgba(255,255,255,.22)]">
      {initials}
    </div>
  );
}

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [artistResult, catalogResult] = await Promise.all([
    fetchPublicArtistBySlug(slug),
    getPublishedCardsByArtistSlug(slug),
  ]);

  if (artistResult.status === "not_found") {
    notFound();
  }

  const artist =
    artistResult.artist ??
    (slug === "hatchvision-studio"
      ? {
          bio: "Demo artist profile for GPT-Codex AWO development.",
          focus: "Verified AWO artist",
          name: "HatchVision Studio",
          slug: "hatchvision-studio",
          websiteUrl: "https://hatchvision.com",
        }
      : null);

  if (!artist) {
    notFound();
  }

  const cards = catalogResult.status === "ready" ? catalogResult.cards : [];

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="artists" />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_45%,#f4f0ea_100%)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1fr_360px] lg:px-10">
          <div className="flex flex-col gap-6 sm:flex-row">
            <ArtistMark name={artist.name} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                {artist.focus}
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
                {artist.name}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#4b4743]">
                {artist.bio ??
                  "This approved AWO artist profile anchors human origin, story, and published card records."}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-12 items-center justify-center bg-[#252525] px-6 text-sm font-black uppercase tracking-wide text-white hover:bg-[#3a3632]"
                  href="/studio"
                >
                  Artist Studio
                </Link>
                {artist.websiteUrl ? (
                  <a
                    className="inline-flex h-12 items-center justify-center border border-[#dfd5ca] bg-white px-6 text-sm font-black uppercase tracking-wide text-[#7a472e] hover:border-[#b7653a]"
                    href={artist.websiteUrl}
                  >
                    Artist Website
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="h-fit border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
              Origin posture
            </p>
            <div className="mt-5 space-y-3 text-sm leading-6 text-[#4b4743]">
              <p className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
                Approved profiles are the public story layer for human-created
                work.
              </p>
              <p className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
                Published cards connect this profile to checkout, reveal,
                custody, and ownership records.
              </p>
              <p className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
                Admin review and audit trails stay protected behind the
                operational dashboard.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
              Published work
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-normal">
              Cards by {artist.name}
            </h2>
          </div>
          <Link
            className="text-sm font-black uppercase tracking-wide text-[#7a472e]"
            href="/artists"
          >
            Back to artists
          </Link>
        </div>

        {cards.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Link
                className="group border border-[#e5ded6] bg-white p-4 shadow-[0_18px_45px_rgba(45,38,32,.06)]"
                href={`/shop/${card.slug}`}
                key={card.slug}
              >
                <div
                  aria-label={`${card.title} artwork`}
                  className="aspect-[3/4] border border-[#e5ded6] bg-[#f4f0ea] shadow-[0_12px_28px_rgba(45,38,32,.1)]"
                  role="img"
                  style={{
                    backgroundImage: card.cover_media_url
                      ? `url(${card.cover_media_url})`
                      : undefined,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                />
                <h3 className="mt-4 text-lg font-black group-hover:text-[#a85f38]">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm font-bold text-[#6e6258]">
                  {formatPrice(card.price_cents, card.currency)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 border border-dashed border-[#dfd5ca] bg-white p-6">
            <h3 className="text-xl font-black">No published cards yet</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4b4743]">
              This artist profile is approved, but no published catalog cards
              are attached yet. The artist story can still be reviewed while
              cards move through approval.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
