"use client";

import { useState } from "react";
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
  ownership_summary: string | null;
  recipient_name: string | null;
  reveal_public_id: string | null;
  reveal_status: string | null;
  success: boolean;
};

function QrIcon() {
  return (
    <svg aria-hidden="true" className="size-9" viewBox="0 0 24 24">
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

export default function RevealClient() {
  const [cardCode, setCardCode] = useState("AWO-DEMO-001");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState("");
  const [reveal, setReveal] = useState<RevealPayload | null>(null);

  const canReveal = cardCode.trim().length > 0 && pin.trim().length > 0;

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

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_45%,#f4f0ea_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1fr_420px] lg:px-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
              QR + PIN reveal
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-none tracking-tight sm:text-6xl">
              Unlock the story behind the card.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4b4743]">
              Enter the card code and PIN from a real reveal record. Validation
              runs through AWO and Supabase; raw PINs are never exposed back to
              the browser.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Scan QR", "Enter PIN", "Reveal Provenance"].map((step) => (
                <div
                  className="border border-[#e5ded6] bg-white p-4 text-sm font-black uppercase tracking-wide text-[#373431]"
                  key={step}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
            <div className="flex items-center gap-3 text-[#b7653a]">
              <QrIcon />
              <div>
                <h2 className="text-xl font-black">Reveal Access</h2>
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
              {isLoading ? "Verifying..." : "Verify Reveal"}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {reveal ? (
          <div>
            <div className="flex items-center gap-3 text-[#b7653a]">
              <ShieldIcon />
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                Reveal unlocked
              </p>
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              {reveal.card_title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4b4743]">
              {reveal.card_description}
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="border border-[#e5ded6] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
                  Artist
                </p>
                <p className="mt-2 text-xl font-black">{reveal.artist_name}</p>
                <p className="mt-2 text-sm leading-6 text-[#4b4743]">
                  {reveal.artist_bio}
                </p>
              </div>
              <div className="border border-[#e5ded6] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
                  Recipient
                </p>
                <p className="mt-2 text-xl font-black">{reveal.recipient_name}</p>
                <p className="mt-2 text-sm text-[#4b4743]">
                  {reveal.ownership_summary}
                </p>
              </div>
              <div className="border border-[#e5ded6] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
                  Record
                </p>
                <p className="mt-2 text-xl font-black">{reveal.reveal_public_id}</p>
                <p className="mt-2 text-sm text-[#4b4743]">
                  {reveal.checkout_reference} · {reveal.reveal_status}
                </p>
              </div>
            </div>
            <div className="mt-8 border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                Chain of Custody
              </p>
              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                {reveal.custody_steps.map((step, index) => (
                  <div className="relative" key={`${step.label}-${index}`}>
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
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {reveal.evidence_items.map((item) => (
                <article
                  className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]"
                  key={item.label}
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                    {item.label}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#4b4743]">
                    {item.value}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="border border-[#e5ded6] bg-white p-8 text-center">
            <h2 className="text-2xl font-black">Reveal Locked</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#4b4743]">
              Use demo code <span className="font-black">AWO-DEMO-001</span> and
              PIN <span className="font-black">1234</span> to verify the current
              Supabase-backed reveal path.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
