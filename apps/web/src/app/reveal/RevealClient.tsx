"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import StorefrontNav from "@/app/components/StorefrontNav";

type RevealPayload = {
  artist_bio: string | null;
  artist_name: string | null;
  card_description: string | null;
  card_title: string | null;
  checkout_reference: string | null;
  custody_steps: Array<{ label: string; value: string }>;
  evidence_items: Array<{ label: string; value: string }>;
  message: string;
  occasion_label: string | null;
  ownership_summary: string | null;
  recipient_name: string | null;
  reveal_public_id: string | null;
  reveal_status: string | null;
  sender_message: string | null;
  success: boolean;
};

const demoRevealPayload: RevealPayload = {
  artist_bio:
    "HatchVision Studio is the seeded AWO demo artist profile. This profile stands in for a real artist origin record: human-made artwork, artist-approved story notes, and a published card that can be traced through purchase, reveal, custody, and ownership evidence.",
  artist_name: "HatchVision Studio",
  card_description:
    "A hand-painted wildflower card prepared for the AWO demo flow, with artist story, paid checkout, private reveal, custody events, and ownership record evidence connected end to end.",
  card_title: "Wildflower Notes",
  checkout_reference: "AWO-DEMO-CHECKOUT",
  custody_steps: [
    { label: "Created", value: "Artist-origin record created for Wildflower Notes." },
    { label: "Purchased", value: "Demo checkout records the buyer intent and gift context." },
    { label: "Gifted", value: "Recipient reveal is prepared with a private code and PIN." },
    { label: "Revealed", value: "The recipient opens the card playback and proof layer." },
  ],
  evidence_items: [
    { label: "Artist story", value: "Human-made origin and artist narrative are attached." },
    { label: "Card record", value: "Wildflower Notes remains tied to the published card SKU." },
    { label: "Reveal code", value: "AWO-DEMO-001" },
  ],
  message: "Reveal unlocked.",
  occasion_label: "Birthday",
  ownership_summary:
    "Demo ownership is staged for stakeholder review. Live ownership claims remain disabled until launch approval.",
  recipient_name: "Demo Recipient",
  reveal_public_id: "AWO-DEMO-001",
  reveal_status: "opened",
  sender_message:
    "I picked this card because it felt calm, personal, and traceable back to a real human origin story.",
  success: true,
};

function QrIcon() {
  return (
    <svg aria-hidden="true" className="size-8" viewBox="0 0 24 24">
      <path
        d="M5 5h5v5H5z M14 5h5v5h-5z M5 14h5v5H5z M15 15h1v1h-1z M18 14h1v1h-1z M14 18h1v1h-1z M18 18h1v1h-1z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
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

function BrushIcon() {
  return (
    <svg aria-hidden="true" className="size-7" viewBox="0 0 24 24">
      <path
        d="M14 4c1.8 1.1 3.1 2.5 3.8 4.1L9.4 16.5c-.8.8-2 .8-2.8 0s-.8-2 0-2.8L14 4Z M5 18c-1 1-2.2 1.5-3.5 1.5C2 18.2 2.5 17 3.5 16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden="true" className="size-7" viewBox="0 0 24 24">
      <path
        d="M9 12a4 4 0 0 1 4-4h3a4 4 0 0 1 0 8h-2 M15 12a4 4 0 0 1-4 4H8a4 4 0 0 1 0-8h2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function LockedPreview() {
  const features = [
    {
      body: "The card, recipient name, and sender-selected moment come together as one private reveal.",
      icon: <QrIcon />,
      title: "Personal reveal",
    },
    {
      body: "Artist bio, creation notes, and card record are displayed after the PIN is verified.",
      icon: <BrushIcon />,
      title: "Artist story",
    },
    {
      body: "AWO shows the custody trail from creation through purchase, gifting, and reveal.",
      icon: <LinkIcon />,
      title: "Provenance trail",
    },
    {
      body: "Ownership status and reveal record give the recipient a trustable proof layer.",
      icon: <ShieldIcon />,
      title: "Ownership proof",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {features.map((feature) => (
        <article
          className="border border-[#e5ded6] bg-white p-5 shadow-[0_14px_35px_rgba(45,38,32,.05)]"
          key={feature.title}
        >
          <div className="flex items-center gap-3 text-[#b7653a]">
            {feature.icon}
            <h3 className="text-sm font-black uppercase tracking-wide text-[#252525]">
              {feature.title}
            </h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#4b4743]">{feature.body}</p>
        </article>
      ))}
    </div>
  );
}

function formatValue(value: string | null | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback;
}

function getCardArtworkUrl(cardTitle: string | null | undefined) {
  const normalized = cardTitle?.trim().toLowerCase() ?? "";

  const artworkByTitle: Record<string, string> = {
    "wildflower notes": "/cards/wildflower-notes.svg",
    "coastal morning": "/cards/coastal-morning.svg",
    "with all my heart": "/cards/with-all-my-heart.svg",
    "morning song": "/cards/morning-song.svg",
    "misty pines": "/cards/misty-pines.svg",
  };

  return artworkByTitle[normalized] ?? null;
}

function getInitialDemoReveal() {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("demo") === "1";
}

export default function RevealClient() {
  const [isDemoReveal] = useState(getInitialDemoReveal);
  const [cardCode, setCardCode] = useState(() => {
    if (typeof window === "undefined") {
      return "AWO-DEMO-001";
    }

    return new URLSearchParams(window.location.search).get("code") ?? "AWO-DEMO-001";
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState(() => (getInitialDemoReveal() ? "1234" : ""));
  const [reveal, setReveal] = useState<RevealPayload | null>(null);
  const [showPin, setShowPin] = useState(false);

  const canReveal = cardCode.trim().length > 0 && pin.trim().length > 0;
  const activeReveal = reveal ?? (isDemoReveal ? demoRevealPayload : null);
  const recipientName = formatValue(activeReveal?.recipient_name, "your recipient");
  const cardTitle = formatValue(activeReveal?.card_title, "AWO card");
  const artistName = formatValue(activeReveal?.artist_name, "the artist");
  const occasionLabel = formatValue(activeReveal?.occasion_label, "your occasion");
  const senderMessage = formatValue(
    activeReveal?.sender_message,
    "The sender message will appear here when it is included at checkout.",
  );
  const cardArtworkUrl = getCardArtworkUrl(activeReveal?.card_title);
  const evidenceItems = useMemo(
    () => (activeReveal?.evidence_items ?? []).filter((item) => item.label || item.value),
    [activeReveal],
  );
  const custodySteps = useMemo(
    () => (activeReveal?.custody_steps ?? []).filter((step) => step.label || step.value),
    [activeReveal],
  );

  function useDemoCredentials() {
    setCardCode("AWO-DEMO-001");
    setPin("1234");
    setError("");
  }

  async function verifyReveal() {
    if (!canReveal) {
      return;
    }

    setError("");
    setReveal(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/reveal/verify", {
        body: JSON.stringify({
          cardCode,
          pin,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as RevealPayload | { message?: string };

      if (!response.ok || !("success" in payload) || !payload.success) {
        setError(payload.message ?? "That code and PIN could not be verified.");
        return;
      }

      setReveal(payload);
    } catch {
      setError("Reveal validation is temporarily unavailable.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="reveal" />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_48%,#f4f0ea_100%)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_390px] lg:px-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
              Recipient playback
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
              The private story behind your card.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4b4743]">
              AWO uses the card code and PIN to unlock the artist story,
              provenance evidence, custody trail, and ownership proof tied to
              this specific gift.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Private access", "Human-made origin", "Verified ownership"].map(
                (step) => (
                  <div
                    className="border border-[#e5ded6] bg-white p-4 text-sm font-black uppercase tracking-wide text-[#373431]"
                    key={step}
                  >
                    {step}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
            <div className="flex items-center gap-3 text-[#b7653a]">
              <QrIcon />
              <div>
                <h2 className="text-xl font-black">Open Reveal</h2>
                <p className="text-sm text-[#4b4743]">Demo code: AWO-DEMO-001</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
                Card Code
                <input
                  className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                  onChange={(event) => setCardCode(event.target.value)}
                  placeholder="AWO-DEMO-001"
                  type="text"
                  value={cardCode}
                />
              </label>
              <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
                PIN
                <span className="mt-2 flex h-11 border border-[#dfd5ca] bg-[#fbfaf8] focus-within:border-[#b7653a]">
                  <input
                    className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium normal-case tracking-normal outline-none"
                    onChange={(event) => setPin(event.target.value)}
                    placeholder="1234"
                    type={showPin ? "text" : "password"}
                    value={pin}
                  />
                  <button
                    aria-label={showPin ? "Hide PIN" : "Show PIN"}
                    className="border-l border-[#dfd5ca] px-3 text-xs font-black uppercase tracking-wide text-[#6e6258] hover:text-[#252525]"
                    onClick={() => setShowPin((current) => !current)}
                    type="button"
                  >
                    {showPin ? "Hide" : "Show"}
                  </button>
                </span>
              </label>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                className="h-10 border border-[#dfd5ca] px-3 text-xs font-black uppercase tracking-wide text-[#6e6258] hover:border-[#b7653a] hover:text-[#252525]"
                onClick={useDemoCredentials}
                type="button"
              >
                Use demo credentials
              </button>
              <Link
                className="flex h-10 items-center justify-center border border-[#dfd5ca] px-3 text-xs font-black uppercase tracking-wide text-[#6e6258] hover:border-[#b7653a] hover:text-[#252525]"
                href="/demo"
              >
                Demo script
              </Link>
            </div>

            {error ? (
              <p className="mt-4 border border-[#f0c7c7] bg-[#fff5f5] p-3 text-sm font-bold text-[#9d1c1c]">
                {error}
              </p>
            ) : null}

            {isDemoReveal ? (
              <p className="mt-4 border border-[#e5ded6] bg-[#fbfaf8] p-3 text-xs font-bold text-[#6e6258]">
                Demo reveal mode prefilled the code and PIN for the seeded
                stakeholder walkthrough.
              </p>
            ) : null}

            <button
              className={`mt-6 h-12 w-full px-4 text-sm font-black uppercase tracking-wide ${
                canReveal
                  ? "bg-[#252525] text-white hover:bg-[#3a3632]"
                  : "bg-[#e5ded6] text-[#8a8178]"
              }`}
              disabled={!canReveal || isLoading}
              onClick={verifyReveal}
              type="button"
            >
              {isLoading ? "Opening..." : "Unlock Playback"}
            </button>

            <p className="mt-4 text-xs leading-5 text-[#6b625a]">
              PIN verification happens server-side through AWO. The browser only
              receives the reveal result.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {activeReveal ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="space-y-6">
              <div className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)] sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                  {cardArtworkUrl ? (
                    <div className="mx-auto w-full max-w-[220px]">
                      <div
                        aria-label={`${cardTitle} artwork`}
                        className="aspect-[3/4] border border-[#e5ded6] bg-[#f4f0ea] shadow-[0_16px_35px_rgba(45,38,32,.1)]"
                        role="img"
                        style={{
                          backgroundImage: `url(${cardArtworkUrl})`,
                          backgroundPosition: "center",
                          backgroundSize: "cover",
                        }}
                      />
                    </div>
                  ) : null}
                  <div>
                    <div className="flex items-center gap-3 text-[#b7653a]">
                      <ShieldIcon />
                      <p className="text-xs font-black uppercase tracking-[0.16em]">
                        Reveal unlocked
                      </p>
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                      For {recipientName}
                    </h2>
                    <p className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-[#b7653a]">
                      {occasionLabel}
                    </p>
                    <p className="mt-4 max-w-3xl text-base leading-7 text-[#4b4743]">
                      This is the verified playback for <strong>{cardTitle}</strong>,
                      an ArtWithOrigin card by <strong>{artistName}</strong>. The
                      record below ties the gift, artwork, purchase, reveal, and
                      ownership trail together.
                    </p>
                    <p className="mt-4 border border-[#f4d3bc] bg-[#fff8ef] p-3 text-sm font-bold leading-6 text-[#6f3a1f]">
                      Demo-safe proof layer: this walkthrough uses seeded test data
                      to show the recipient experience before live ownership claims
                      are enabled.
                    </p>
                  </div>
                </div>
                <div className="mt-6 border border-[#efe8df] bg-[#fbfaf8] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                    Sender message
                  </p>
                  <p className="mt-3 text-base leading-7 text-[#373431]">
                    {senderMessage}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <article className="border border-[#e5ded6] bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
                    Card
                  </p>
                  <p className="mt-2 text-xl font-black">{cardTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[#4b4743]">
                    {formatValue(
                      activeReveal.card_description,
                      "Card description captured in the AWO catalog.",
                    )}
                  </p>
                </article>
                <article className="border border-[#e5ded6] bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
                    Artist
                  </p>
                  <p className="mt-2 text-xl font-black">{artistName}</p>
                  <p className="mt-2 text-sm leading-6 text-[#4b4743]">
                    {formatValue(
                      activeReveal.artist_bio,
                      "Artist story captured by ArtWithOrigin.",
                    )}
                  </p>
                </article>
                <article className="border border-[#e5ded6] bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
                    Ownership
                  </p>
                  <p className="mt-2 text-xl font-black">
                    {formatValue(activeReveal.reveal_status, "opened")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#4b4743]">
                    {formatValue(
                      activeReveal.ownership_summary,
                      "Ownership proof is tied to the paid and fulfilled card record.",
                    )}
                  </p>
                </article>
              </div>

              <div className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                  Chain of custody
                </p>
                <div className="mt-5 grid gap-4 lg:grid-cols-4">
                  {(custodySteps.length > 0
                    ? custodySteps
                    : [
                        { label: "Created", value: "Artist-origin record created." },
                        { label: "Purchased", value: "Order recorded in AWO." },
                        { label: "Gifted", value: "Recipient reveal prepared." },
                        { label: "Revealed", value: "PIN verified and opened." },
                      ]
                  ).map((step, index) => (
                    <article className="relative" key={`${step.label}-${index}`}>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#252525] text-sm font-black text-white">
                          {index + 1}
                        </span>
                        <h3 className="text-sm font-black uppercase tracking-wide">
                          {step.label}
                        </h3>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#4b4743]">
                        {step.value}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="border border-[#e5ded6] bg-white p-5 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                  Reveal record
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-black uppercase tracking-wide text-[#8a8178]">
                      Reveal ID
                    </dt>
                    <dd className="mt-1 break-words font-bold">
                      {formatValue(activeReveal.reveal_public_id, "Not recorded")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-black uppercase tracking-wide text-[#8a8178]">
                      Checkout
                    </dt>
                    <dd className="mt-1 break-words font-bold">
                      {formatValue(activeReveal.checkout_reference, "Not recorded")}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="border border-[#e5ded6] bg-white p-5 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                  Evidence
                </p>
                <div className="mt-4 space-y-3">
                  {(evidenceItems.length > 0
                    ? evidenceItems
                    : [
                        {
                          label: "Artist story",
                          value: "Artist story captured by AWO.",
                        },
                        {
                          label: "Card record",
                          value: cardTitle,
                        },
                        {
                          label: "Reveal code",
                          value: formatValue(activeReveal.reveal_public_id, "Private reveal record"),
                        },
                      ]
                  ).map((item) => (
                    <article
                      className="border border-[#efe8df] bg-[#fbfaf8] p-4"
                      key={item.label}
                    >
                      <h3 className="text-sm font-black">{item.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#4b4743]">
                        {item.value}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="border border-[#e5ded6] bg-white p-5 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                  Operator proof links
                </p>
                <div className="mt-4 grid gap-2">
                  {[
                    { href: "/admin/reconciliation", label: "Lifecycle reconciliation" },
                    { href: "/admin/custody", label: "Custody events" },
                    { href: "/admin/ownership", label: "Ownership records" },
                  ].map((link) => (
                    <Link
                      className="border border-[#efe8df] bg-[#fbfaf8] px-4 py-3 text-sm font-black text-[#373431] hover:border-[#b7653a]"
                      href={link.href}
                      key={link.href}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)] sm:p-8">
              <h2 className="text-2xl font-black">Reveal is locked</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4b4743]">
                Enter the code and PIN from the card to open the recipient
                playback. For the current seeded demo, use code{" "}
                <span className="font-black">AWO-DEMO-001</span> and PIN{" "}
                <span className="font-black">1234</span>.
              </p>
              <div className="mt-6">
                <LockedPreview />
              </div>
            </section>
            <aside className="h-fit border border-[#e5ded6] bg-[#fff8ef] p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                Demo readiness note
              </p>
              <p className="mt-3 text-sm leading-6 text-[#4b4743]">
                This page is now the stakeholder playback surface. Admin
                reconciliation still proves the background lifecycle, but the
                recipient experience is what buyers, artists, and investors
                should feel first.
              </p>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
