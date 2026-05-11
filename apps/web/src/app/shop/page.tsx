import Link from "next/link";
import Image from "next/image";
import StorefrontNav from "@/app/components/StorefrontNav";
import { getPublishedCards, type PublishedCard } from "@/lib/public-catalog";

type ShopPageProps = {
  searchParams?: Promise<{
    occasion?: string;
    q?: string;
  }>;
};

const categories = [
  { href: "/shop", label: "All Cards", value: "" },
  { href: "/shop?occasion=birthday", label: "Birthday", value: "birthday" },
  { href: "/shop?occasion=sympathy", label: "Sympathy", value: "sympathy" },
  { href: "/shop?occasion=love", label: "Love", value: "love" },
  { href: "/shop?occasion=thanks", label: "Thanks", value: "thanks" },
  { href: "/shop?occasion=originals", label: "Originals", value: "originals" },
];

const cardLooks = [
  "from-[#fbf5e9] via-[#f7f0df] to-[#e7ddc8]",
  "from-[#dfe9ed] via-[#c8d7dc] to-[#8aa2aa]",
  "from-[#faf5e6] via-[#fffaf1] to-[#ebd9ad]",
  "from-[#f8cf55] via-[#ee8d48] to-[#72a6b5]",
  "from-[#df8b61] via-[#61a493] to-[#ddc153]",
];

function formatPrice(card: PublishedCard) {
  return new Intl.NumberFormat("en-US", {
    currency: card.currency,
    style: "currency",
  }).format(card.price_cents / 100);
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="size-8" viewBox="0 0 24 24">
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

function FingerprintIcon() {
  return (
    <svg aria-hidden="true" className="size-8" viewBox="0 0 24 24">
      <path
        d="M7 11a5 5 0 0 1 10 0c0 4-1.4 6.4-3.2 9M12 11c0 4.6-1.4 7-3.6 9M5 15c.4-2.2.4-3.7.4-4a6.6 6.6 0 0 1 13.2 0c0 1.6-.2 3-.7 4.2M9 4.7A8 8 0 0 1 20 12M4 12a8 8 0 0 1 2-5.3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function LineIcon({ kind }: { kind: "image" | "link" | "lock" | "qr" | "user" }) {
  const paths = {
    image: "M4 5h16v14H4z M7 15l3-3 3 3 2-2 3 3 M8 9h.1",
    link: "M9 12a4 4 0 0 1 4-4h3a4 4 0 0 1 0 8h-2 M15 12a4 4 0 0 1-4 4H8a4 4 0 0 1 0-8h2",
    lock: "M7 10h10v9H7z M9 10V8a3 3 0 0 1 6 0v2 M12 14v2",
    qr: "M5 5h5v5H5z M14 5h5v5h-5z M5 14h5v5H5z M15 15h1v1h-1z M18 14h1v1h-1z M14 18h1v1h-1z M18 18h1v1h-1z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0",
  } as const;

  return (
    <svg aria-hidden="true" className="size-8" viewBox="0 0 24 24">
      <path
        d={paths[kind]}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      className="inline-flex items-center justify-center"
      href="/"
    >
      <Image
        alt="ArtWithOrigin"
        className={compact ? "h-12 w-auto object-contain" : "h-auto w-full object-contain"}
        height={compact ? 64 : 232}
        priority
        src="/awo-logo.png"
        width={compact ? 122 : 440}
      />
    </Link>
  );
}

function TrustRow() {
  const items = [
    { icon: <ShieldIcon />, label: "Authentic Human Creation" },
    { icon: <FingerprintIcon />, label: "Verified Provenance" },
    { icon: <LineIcon kind="qr" />, label: "QR + PIN Reveal" },
    { icon: <LineIcon kind="lock" />, label: "Ownership You Can Trust" },
  ];

  return (
    <div className="mx-auto mt-10 grid max-w-4xl gap-4 text-[#b7653a] sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div className="flex items-center justify-center gap-3" key={item.label}>
          {item.icon}
          <span className="text-xs font-black uppercase tracking-wide text-[#373431]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function CategoryTabs({ active }: { active: string }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-x-12 gap-y-4">
        {categories.map((category) => {
          const selected = category.value === active;

          return (
            <Link
              className={`border-b-2 pb-3 text-sm font-black uppercase tracking-wide ${
                selected
                  ? "border-[#b7653a] text-[#b7653a]"
                  : "border-transparent text-[#2f2d2b] hover:text-[#b7653a]"
              }`}
              href={category.href}
              key={category.label}
            >
              {category.label}
            </Link>
          );
        })}
      </div>
      <button
        className="inline-flex items-center gap-2 self-start text-xs font-black uppercase tracking-wide text-[#2f2d2b]"
        type="button"
      >
        Sort: Newest
        <span className="text-[#b7653a]">v</span>
      </button>
    </div>
  );
}

function CardArtwork({ card, index }: { card: PublishedCard; index: number }) {
  const look = cardLooks[index % cardLooks.length];

  if (card.cover_media_url) {
    return (
      <div
        aria-label={card.title}
        className="h-full w-full object-cover"
        role="img"
        style={{
          backgroundImage: `url(${card.cover_media_url})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${look}`}
    >
      <div className="absolute inset-x-8 top-[-18px] h-9 bg-black/5" />
      <div className="absolute inset-5 border border-white/45" />
      <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_30%_25%,rgba(255,255,255,.9)_0_2px,transparent_3px),linear-gradient(135deg,transparent_0_47%,rgba(123,77,45,.22)_48%_52%,transparent_53%)] [background-size:34px_34px,100%_100%]" />
      <div className="relative max-w-[75%] text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6f452f]/70">
          AWO
        </p>
        <h2 className="mt-3 text-2xl font-black leading-tight text-[#2d2a27]">
          {card.title}
        </h2>
      </div>
    </div>
  );
}

function CardTile({ card, index }: { card: PublishedCard; index: number }) {
  return (
    <article className="group">
      <Link className="block" href={`/shop/${card.slug}`}>
        <div className="relative aspect-[3/4] overflow-visible">
          <div className="absolute left-4 right-4 top-[-18px] h-12 bg-[#eee8dd] shadow-sm" />
          <div className="relative h-full overflow-hidden bg-white shadow-[0_18px_45px_rgba(45,38,32,.14)] transition duration-200 group-hover:-translate-y-1">
            <CardArtwork card={card} index={index} />
          </div>
        </div>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#252525]">{card.title}</h3>
            <p className="mt-1 text-sm font-medium text-[#4b4743]">
              by {card.artist_name}
            </p>
            <p className="mt-5 text-lg font-black text-[#252525]">
              {formatPrice(card)}
            </p>
          </div>
          <span className="mb-1 text-[#b7653a]">
            <ShieldIcon />
          </span>
        </div>
      </Link>
    </article>
  );
}

function filterCards(
  cards: PublishedCard[],
  filters: { occasion: string; q: string },
) {
  const query = filters.q.trim().toLowerCase();

  return cards.filter((card) => {
    const matchesOccasion =
      !filters.occasion || card.occasion_tags.includes(filters.occasion);
    const matchesQuery =
      !query ||
      card.title.toLowerCase().includes(query) ||
      card.description?.toLowerCase().includes(query) ||
      card.artist_name.toLowerCase().includes(query);

    return matchesOccasion && matchesQuery;
  });
}

function FeatureStrip() {
  const features = [
    {
      body: "Scan the QR code on your card or enter your PIN to unlock.",
      icon: <LineIcon kind="qr" />,
      title: "Scan to Reveal",
    },
    {
      body: "Discover the inspiration, process, and story behind your piece.",
      icon: <LineIcon kind="user" />,
      title: "Artist Story",
    },
    {
      body: "See time-stamped captures and sensor data from creation.",
      icon: <LineIcon kind="image" />,
      title: "Capture Evidence",
    },
    {
      body: "Follow the verified journey from creation to ownership.",
      icon: <LineIcon kind="link" />,
      title: "Chain of Custody",
    },
    {
      body: "Your piece is protected on our secure provenance network.",
      icon: <ShieldIcon />,
      title: "Verified Ownership",
    },
  ];

  return (
    <section className="border-t border-[#e5ded6] bg-white/80">
      <div className="mx-auto grid max-w-7xl divide-y divide-[#e5ded6] px-6 py-8 md:grid-cols-5 md:divide-x md:divide-y-0 lg:px-10">
        {features.map((feature) => (
          <div className="flex gap-5 px-3 py-4 text-[#b7653a]" key={feature.title}>
            <div className="shrink-0">{feature.icon}</div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wide text-[#2f2d2b]">
                {feature.title}
              </h3>
              <p className="mt-2 text-xs font-medium leading-5 text-[#373431]">
                {feature.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const catalog = await getPublishedCards();
  const params = searchParams ? await searchParams : {};
  const filters = {
    occasion: params.occasion ?? "",
    q: params.q ?? "",
  };
  const cards =
    catalog.status === "ready" ? filterCards(catalog.cards, filters) : [];

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="shop" />

      <section className="bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_45%,#f4f0ea_100%)] px-6 pb-12 pt-12 lg:px-10">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mx-auto max-w-[440px]">
            <BrandLogo />
          </div>
          <TrustRow />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-10">
        <CategoryTabs active={filters.occasion} />

        {catalog.status === "ready" && cards.length > 0 ? (
          <div className="mt-10 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((card, index) => (
              <CardTile card={card} index={index} key={card.id} />
            ))}
          </div>
        ) : null}

        {catalog.status === "ready" && cards.length === 0 ? (
          <div className="mt-10 border border-[#e5ded6] bg-white p-8 text-center">
            <h2 className="text-xl font-bold">No Matching Cards</h2>
            <p className="mt-2 text-sm text-[#4b4743]">
              Try another category or return to all cards.
            </p>
          </div>
        ) : null}

        {catalog.status !== "ready" ? (
          <div className="mt-10 border border-[#e5ded6] bg-white p-8 text-center">
            <h2 className="text-xl font-bold">Catalog Not Ready</h2>
            <p className="mt-2 text-sm text-[#4b4743]">{catalog.message}</p>
          </div>
        ) : null}
      </section>

      <FeatureStrip />
    </main>
  );
}
