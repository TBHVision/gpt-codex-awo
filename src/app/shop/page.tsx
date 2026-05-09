import { getPublishedCards, type PublishedCard } from "@/lib/public-catalog";

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

export default async function ShopPage() {
  const catalog = await getPublishedCards();

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
        {catalog.status === "ready" && catalog.cards.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.cards.map((card) => (
              <CardTile card={card} key={card.id} />
            ))}
          </div>
        ) : null}

        {catalog.status === "ready" && catalog.cards.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">No Cards Yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Published cards will appear here after catalog seed data or artist
              approvals are available.
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
