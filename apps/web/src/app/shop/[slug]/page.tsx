import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublishedCardBySlug,
  type PublishedCard,
} from "@/lib/public-catalog";

type CardDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function formatPrice(card: PublishedCard) {
  return new Intl.NumberFormat("en-US", {
    currency: card.currency,
    style: "currency",
  }).format(card.price_cents / 100);
}

function TagList({ label, tags }: { label: string; tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600"
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { slug } = await params;
  const result = await getPublishedCardBySlug(slug);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status !== "ready") {
    return (
      <main className="min-h-screen bg-[#f6f4ef] px-5 py-8 text-slate-950 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h1 className="text-2xl font-semibold">Card Not Ready</h1>
          <p className="mt-2 text-sm leading-6">{result.message}</p>
          <Link
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            href="/shop"
          >
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const { card } = result;

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8">
          <Link className="text-sm font-semibold text-slate-500" href="/shop">
            Back to Shop
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-slate-200 bg-[#e8eef3] px-8 text-center shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              {card.artist_name}
            </p>
            <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
              {card.title}
            </h1>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
            {card.artist_name}
          </p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <h2 className="text-3xl font-semibold">{card.title}</h2>
            <p className="shrink-0 text-lg font-semibold">
              {formatPrice(card)}
            </p>
          </div>
          <p className="mt-4 text-base leading-7 text-slate-600">
            {card.description}
          </p>

          <div className="mt-6 space-y-5">
            <TagList label="Occasions" tags={card.occasion_tags} />
            <TagList label="Recipients" tags={card.recipient_tags} />
          </div>

          <button
            className="mt-8 h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            type="button"
          >
            Add to Cart
          </button>
        </div>
      </section>
    </main>
  );
}
