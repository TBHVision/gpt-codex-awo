import Link from "next/link";
import StorefrontNav from "@/app/components/StorefrontNav";
import { getPublishedCards, type PublishedCard } from "@/lib/public-catalog";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

function formatPrice(card: PublishedCard) {
  return new Intl.NumberFormat("en-US", {
    currency: card.currency,
    style: "currency",
  }).format(card.price_cents / 100);
}

function searchCards(cards: PublishedCard[], query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return cards.filter((card) =>
    [
      card.title,
      card.artist_name,
      card.description ?? "",
      ...card.occasion_tags,
      ...card.recipient_tags,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}

function SearchResultCard({ card }: { card: PublishedCard }) {
  return (
    <Link
      className="grid gap-4 border border-[#e5ded6] bg-white p-4 shadow-[0_18px_45px_rgba(45,38,32,.06)] transition hover:-translate-y-0.5 hover:border-[#b7653a] sm:grid-cols-[120px_1fr]"
      href={`/shop/${card.slug}`}
    >
      <div className="aspect-[3/4] overflow-hidden bg-[#f4f0ea]">
        {card.cover_media_url ? (
          <div
            aria-label={card.title}
            className="h-full w-full"
            role="img"
            style={{
              backgroundImage: `url(${card.cover_media_url})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#f4e8d9] p-4 text-center text-sm font-black uppercase tracking-wide text-[#7a472e]">
            AWO
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
            {card.occasion_tags.slice(0, 2).join(" / ") || "Original"}
          </p>
          <h2 className="mt-2 text-2xl font-black">{card.title}</h2>
          <p className="mt-1 text-sm font-semibold text-[#5d554e]">
            by {card.artist_name}
          </p>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#4b4743]">
            {card.description ?? "Human-made card with AWO provenance."}
          </p>
        </div>
        <p className="text-lg font-black">{formatPrice(card)}</p>
      </div>
    </Link>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = searchParams ? await searchParams : {};
  const query = params.q?.trim() ?? "";
  const catalog = await getPublishedCards();
  const results = catalog.status === "ready" ? searchCards(catalog.cards, query) : [];
  const suggestions = ["birthday", "wildflower", "thanks", "coastal", "originals"];

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="search" />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_48%,#f4f0ea_100%)]">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
            Search
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Find the right verified card.
          </h1>
          <form action="/search" className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              className="h-12 min-w-0 flex-1 border border-[#dfd5ca] bg-white px-4 text-base outline-none focus:border-[#b7653a]"
              defaultValue={query}
              name="q"
              placeholder="Search by card, artist, occasion, or mood"
              type="search"
            />
            <button
              className="h-12 bg-[#252525] px-6 text-sm font-black uppercase tracking-wide text-white hover:bg-[#3a3632]"
              type="submit"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        {!query ? (
          <div className="border border-[#e5ded6] bg-white p-6">
            <h2 className="text-xl font-black">Popular searches</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {suggestions.map((suggestion) => (
                <Link
                  className="inline-flex h-10 items-center border border-[#dfd5ca] bg-[#fbfaf8] px-4 text-sm font-black uppercase tracking-wide text-[#6e6258] hover:border-[#b7653a] hover:text-[#a85f38]"
                  href={`/search?q=${encodeURIComponent(suggestion)}`}
                  key={suggestion}
                >
                  {suggestion}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {catalog.status !== "ready" ? (
          <div className="border border-[#e5ded6] bg-white p-6">
            <h2 className="text-xl font-black">Search unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-[#4b4743]">{catalog.message}</p>
          </div>
        ) : null}

        {query && catalog.status === "ready" ? (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                  Results
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {results.length} match{results.length === 1 ? "" : "es"} for
                  {" "}
                  &quot;{query}&quot;
                </h2>
              </div>
              <Link
                className="text-sm font-black uppercase tracking-wide text-[#a85f38]"
                href="/shop"
              >
                Browse all cards
              </Link>
            </div>

            {results.length > 0 ? (
              <div className="mt-6 grid gap-4">
                {results.map((card) => (
                  <SearchResultCard card={card} key={card.id} />
                ))}
              </div>
            ) : (
              <div className="mt-6 border border-[#e5ded6] bg-white p-6">
                <h3 className="text-xl font-black">No cards found</h3>
                <p className="mt-2 text-sm leading-6 text-[#4b4743]">
                  Try a broader occasion, artist name, or browse the full shop.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
