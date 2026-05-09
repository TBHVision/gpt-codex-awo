import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublishedCardBySlug,
  type PublishedCard,
} from "@/lib/public-catalog";
import AddToCartButton from "./AddToCartButton";

type CardDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function formatPrice(card: PublishedCard) {
  return new Intl.NumberFormat("en-US", {
    currency: card.currency,
    style: "currency",
  }).format(card.price_cents / 100);
}

function LineIcon({ kind }: { kind: "cart" | "lock" | "qr" | "search" | "user" }) {
  const paths = {
    cart: "M6 6h15l-2 8H8L6 3H3 M9 20h.1 M18 20h.1",
    lock: "M7 10h10v9H7z M9 10V8a3 3 0 0 1 6 0v2 M12 14v2",
    qr: "M5 5h5v5H5z M14 5h5v5h-5z M5 14h5v5H5z M15 15h1v1h-1z M18 14h1v1h-1z M14 18h1v1h-1z M18 18h1v1h-1z",
    search: "m21 21-4.4-4.4M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0",
  } as const;

  return (
    <svg aria-hidden="true" className="size-7" viewBox="0 0 24 24">
      <path
        d={paths[kind]}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="size-7" viewBox="0 0 24 24">
      <path
        d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m8.5 12 2.1 2.1 4.9-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Logo() {
  return (
    <Link
      className="inline-flex items-center gap-1.5 font-black tracking-tight text-[#8b4f2c]"
      href="/shop"
    >
      <span className="text-2xl">AW</span>
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,#c98a55_0,#8b4f2c_45%,#5a311b_100%)] text-xs text-[#f8efe4] shadow-[inset_0_0_0_3px_rgba(255,255,255,.2)]">
        O
      </span>
    </Link>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e6e0d9] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-14 text-sm font-bold uppercase tracking-wide text-[#2b2927] md:flex">
          {["Shop", "Artists", "How It Works", "About"].map((item) => (
            <Link
              className={`py-7 ${
                item === "Shop"
                  ? "border-b-2 border-[#b7653a] text-[#a85f38]"
                  : "hover:text-[#a85f38]"
              }`}
              href="/shop"
              key={item}
            >
              {item}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-[#252525]">
          <LineIcon kind="search" />
          <LineIcon kind="user" />
          <Link
            aria-label="Cart"
            className="relative inline-flex size-9 items-center justify-center"
            href="/cart"
          >
            <LineIcon kind="cart" />
            <span className="absolute right-0 top-0 inline-flex size-5 items-center justify-center rounded-full bg-[#a85f38] text-xs font-bold text-white">
              0
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function TagList({ label, tags }: { label: string; tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8a8178]">
        {label}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            className="border border-[#dfd5ca] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#4b4743]"
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function ArtworkPanel({ card }: { card: PublishedCard }) {
  if (card.cover_media_url) {
    return (
      <div className="relative mx-auto aspect-[3/4] max-w-md bg-white shadow-[0_24px_60px_rgba(45,38,32,.18)]">
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
      </div>
    );
  }

  return (
    <div className="relative mx-auto aspect-[3/4] max-w-md overflow-visible">
      <div className="absolute left-8 right-8 top-[-22px] h-14 bg-[#eee8dd] shadow-sm" />
      <div className="relative flex h-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#fbf5e9] via-[#f0e0c9] to-[#c98a55] px-8 text-center shadow-[0_24px_60px_rgba(45,38,32,.18)]">
        <div className="absolute inset-7 border border-white/45" />
        <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_30%_25%,rgba(255,255,255,.9)_0_2px,transparent_3px),linear-gradient(135deg,transparent_0_47%,rgba(123,77,45,.22)_48%_52%,transparent_53%)] [background-size:34px_34px,100%_100%]" />
        <div className="relative max-w-[78%]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6f452f]/70">
            AWO
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-[#2d2a27]">
            {card.title}
          </h1>
        </div>
      </div>
    </div>
  );
}

function TrustList() {
  const items = [
    { icon: <ShieldIcon />, label: "Authentic human creation" },
    { icon: <LineIcon kind="qr" />, label: "QR + PIN reveal ready" },
    { icon: <LineIcon kind="lock" />, label: "Ownership you can trust" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          className="flex items-center gap-3 border border-[#e3d8ce] bg-[#fbfaf8] p-3 text-[#b7653a]"
          key={item.label}
        >
          {item.icon}
          <span className="text-xs font-black uppercase tracking-wide text-[#373431]">
            {item.label}
          </span>
        </div>
      ))}
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
      <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
        <TopNav />
        <section className="mx-auto max-w-3xl px-6 py-12 lg:px-10">
          <div className="border border-[#e5ded6] bg-white p-8 text-center">
            <h1 className="text-2xl font-bold">Card Not Ready</h1>
            <p className="mt-2 text-sm leading-6 text-[#4b4743]">
              {result.message}
            </p>
            <Link
              className="mt-6 inline-flex h-11 items-center justify-center bg-[#252525] px-5 text-sm font-bold uppercase tracking-wide text-white hover:bg-[#3a3632]"
              href="/shop"
            >
              Back to Shop
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { card } = result;

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <TopNav />

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)] lg:px-10 lg:py-14">
        <div>
          <Link
            className="text-xs font-black uppercase tracking-wide text-[#b7653a]"
            href="/shop"
          >
            Back to all cards
          </Link>
          <div className="mt-10">
            <ArtworkPanel card={card} />
          </div>
        </div>

        <aside className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)] lg:p-8">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#8a8178]">
            {card.artist_name}
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                {card.title}
              </h1>
              <p className="mt-3 text-sm font-semibold text-[#4b4743]">
                by {card.artist_name}
              </p>
            </div>
            <p className="shrink-0 text-2xl font-black text-[#252525]">
              {formatPrice(card)}
            </p>
          </div>

          <p className="mt-6 text-base leading-7 text-[#4b4743]">
            {card.description}
          </p>

          <div className="mt-8">
            <TrustList />
          </div>

          <div className="mt-8 grid gap-5">
            <TagList label="Occasions" tags={card.occasion_tags} />
            <TagList label="Recipients" tags={card.recipient_tags} />
          </div>

          <AddToCartButton
            item={{
              artistName: card.artist_name,
              currency: card.currency,
              priceCents: card.price_cents,
              quantity: 1,
              slug: card.slug,
              title: card.title,
            }}
          />

          <div className="mt-6 border-t border-[#e5ded6] pt-5">
            <h2 className="text-xs font-black uppercase tracking-wide text-[#373431]">
              Verified Ownership Preview
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#4b4743]">
              Full provenance evidence unlocks after purchase through the AWO
              QR + PIN reveal flow.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
