"use client";

import { useMemo, useState } from "react";
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

export default function RevealClient() {
  const [cardCode, setCardCode] = useState(() => {
    if (typeof window === "undefined") {
      return "AWO-DEMO-001";
    }

    return new URLSearchParams(window.location.search).get("code") ?? "AWO-DEMO-001";
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState("");
  const [reveal, setReveal] = useState<RevealPayload | null>(null);

  const canReveal = cardCode.trim().length > 0 && pin.trim().length > 0;
  const recipientName = formatValue(reveal?.recipient_name, "your recipient");
  const cardTitle = formatValue(reveal?.card_title, "AWO card");
  const artistName = formatValue(reveal?.artist_name, "the artist");
  const occasionLabel = formatValue(reveal?.occasion_label, "your occasion");
  const senderMessage = formatValue(
    reveal?.sender_message,
    "The sender message will appear here when it is included at checkout.",
  );
  const evidenceItems = useMemo(
    () => (reveal?.evidence_items ?? []).filter((item) => item.label || item.value),
    [reveal],
  );
  const custodySteps = useMemo(
    () => (reveal?.custody_steps ?? []).filter((step) => step.label || step.value),
    [reveal],
  );

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
                <input
                  className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="1234"
                  type="password"
                  value={pin}
                />
              </label>
            </div>

            {error ? (
              <p className="mt-4 border border-[#f0c7c7] bg-[#fff5f5] p-3 text-sm font-bold text-[#9d1c1c]">
                {error}
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
        {reveal ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="space-y-6">
              <div className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)] sm:p-8">
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
                      reveal.card_description,
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
                      reveal.artist_bio,
                      "Artist story captured by ArtWithOrigin.",
                    )}
                  </p>
                </article>
                <article className="border border-[#e5ded6] bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
                    Ownership
                  </p>
                  <p className="mt-2 text-xl font-black">
                    {formatValue(reveal.reveal_status, "opened")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#4b4743]">
                    {formatValue(
                      reveal.ownership_summary,
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
                      {formatValue(reveal.reveal_public_id, "Not recorded")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-black uppercase tracking-wide text-[#8a8178]">
                      Checkout
                    </dt>
                    <dd className="mt-1 break-words font-bold">
                      {formatValue(reveal.checkout_reference, "Not recorded")}
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
                          value: formatValue(reveal.reveal_public_id, "Private reveal record"),
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
