import Link from "next/link";
import { getPublishedCards, type PublishedCard } from "@/lib/public-catalog";

type ShopPageProps = {
  searchParams?: Promise<{
    occasion?: string;
    recipient?: string;
    q?: string;
  }>;
};

function formatPrice(card: PublishedCard) {
  return new Intl.NumberFormat("en-US", {
    currency: card.currency,
    style: "currency",
  }).format(card.price_cents / 100);
}

function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600"
          key={tag}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function CardTile({ card }: { card: PublishedCard }) {
  return (
    <article className="flex min-h-[280px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex aspect-[4/3] items-center justify-center rounded-t-lg border-b border-slate-200 bg-[#e8eef3] px-6 text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {card.artist_name}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {card.title}
          </h2>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">
              {card.title}
            </h3>
            <p className="shrink-0 text-sm font-semibold text-slate-900">
              {formatPrice(card)}
            </p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {card.description}
          </p>
        </div>
        <div className="mt-auto space-y-3">
          <TagList tags={[...card.occasion_tags, ...card.recipient_tags]} />
          <a
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            href={`/shop/${card.slug}`}
          >
            View Card
          </a>
        </div>
      </div>
    </article>
  );
}

function uniqueTags(cards: PublishedCard[], key: "occasion_tags" | "recipient_tags") {
  return Array.from(new Set(cards.flatMap((card) => card[key]))).sort();
}

function filterCards(
  cards: PublishedCard[],
  filters: { occasion: string; q: string; recipient: string },
) {
  const query = filters.q.trim().toLowerCase();

  return cards.filter((card) => {
    const matchesOccasion =
      !filters.occasion || card.occasion_tags.includes(filters.occasion);
    const matchesRecipient =
      !filters.recipient || card.recipient_tags.includes(filters.recipient);
    const matchesQuery =
      !query ||
      card.title.toLowerCase().includes(query) ||
      card.description?.toLowerCase().includes(query) ||
      card.artist_name.toLowerCase().includes(query);

    return matchesOccasion && matchesRecipient && matchesQuery;
  });
}

function FilterSelect({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <select
        className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950"
        defaultValue={value}
        name={name}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const catalog = await getPublishedCards();
  const params = searchParams ? await searchParams : {};
  const filters = {
    occasion: params.occasion ?? "",
    q: params.q ?? "",
    recipient: params.recipient ?? "",
  };
  const cards =
    catalog.status === "ready" ? filterCards(catalog.cards, filters) : [];
  const occasionTags =
    catalog.status === "ready" ? uniqueTags(catalog.cards, "occasion_tags") : [];
  const recipientTags =
    catalog.status === "ready" ? uniqueTags(catalog.cards, "recipient_tags") : [];

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
            AWO
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Greeting Cards
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        {catalog.status === "ready" ? (
          <form
            className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            method="get"
          >
            <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
              <label className="block text-sm font-semibold text-slate-700">
                Search
                <input
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950"
                  defaultValue={filters.q}
                  name="q"
                  placeholder="Birthday, support, artist..."
                  type="search"
                />
              </label>
              <FilterSelect
                label="Occasion"
                name="occasion"
                options={occasionTags}
                value={filters.occasion}
              />
              <FilterSelect
                label="Recipient"
                name="recipient"
                options={recipientTags}
                value={filters.recipient}
              />
              <div className="flex gap-2">
                <button
                  className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                  type="submit"
                >
                  Filter
                </button>
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-slate-400"
                  href="/shop"
                >
                  Reset
                </Link>
              </div>
            </div>
          </form>
        ) : null}

        {catalog.status === "ready" && cards.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <CardTile card={card} key={card.id} />
            ))}
          </div>
        ) : null}

        {catalog.status === "ready" && cards.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">No Matching Cards</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Try another search or reset the filters.
            </p>
          </div>
        ) : null}

        {catalog.status !== "ready" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <h2 className="text-xl font-semibold">Catalog Not Ready</h2>
            <p className="mt-2 text-sm leading-6">{catalog.message}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
