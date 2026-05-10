"use client";

import { useState } from "react";
import StorefrontNav from "@/app/components/StorefrontNav";

const previewSections = [
  {
    body: "A short, personal note from the artist will live here, tying the work back to the moment and human intention behind it.",
    eyebrow: "Artist Story",
    title: "Made by a real person",
  },
  {
    body: "This preview will show timestamped capture evidence, creation notes, and the provenance record tied to the purchased card.",
    eyebrow: "Capture Evidence",
    title: "Creation proof, not just a claim",
  },
  {
    body: "The chain of custody will show how the piece moved from artist to buyer to recipient without exposing private customer data.",
    eyebrow: "Chain of Custody",
    title: "A clear path from origin to you",
  },
  {
    body: "Ownership preview will summarize what was unlocked and how the recipient can revisit the story later.",
    eyebrow: "Verified Ownership",
    title: "Your card, your provenance",
  },
];

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
  const [cardCode, setCardCode] = useState("");
  const [pin, setPin] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);

  const canPreview = cardCode.trim().length > 0 && pin.trim().length > 0;

  function revealPreview() {
    if (!canPreview) {
      return;
    }

    setIsRevealed(true);
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="shop" />

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
              This V0.3 shell previews the recipient experience. It does not
              validate real secrets yet, but it frames the future reveal flow
              around human creation, evidence, custody, and ownership.
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
                <p className="text-sm text-[#4b4743]">Demo-only unlock shell</p>
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

            <button
              className={`mt-6 h-12 w-full px-4 text-sm font-black uppercase tracking-wide ${
                canPreview
                  ? "bg-[#252525] text-white hover:bg-[#3a3632]"
                  : "bg-[#e5ded6] text-[#8a8178]"
              }`}
              disabled={!canPreview}
              onClick={revealPreview}
              type="button"
            >
              Reveal Preview
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {isRevealed ? (
          <div>
            <div className="flex items-center gap-3 text-[#b7653a]">
              <ShieldIcon />
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                Preview unlocked
              </p>
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Provenance preview for {cardCode.trim()}
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {previewSections.map((section) => (
                <article
                  className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]"
                  key={section.eyebrow}
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                    {section.eyebrow}
                  </p>
                  <h3 className="mt-3 text-2xl font-black">{section.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#4b4743]">
                    {section.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="border border-[#e5ded6] bg-white p-8 text-center">
            <h2 className="text-2xl font-black">Reveal Preview Locked</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#4b4743]">
              Enter any demo card code and PIN to preview the future recipient
              reveal. Real QR/PIN validation will come after this experience is
              reviewed.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
