/* eslint-disable @next/next/no-html-link-for-pages */

import StorefrontNav from "@/app/components/StorefrontNav";
import DemoStartButton from "./DemoStartButton";

const journey = [
  {
    body: "Start with the public storefront, open Wildflower Notes, add it to cart, and show that the product is an artist-backed card rather than a generic SKU.",
    cta: "Open shop",
    href: "/shop",
    kicker: "Shopper",
    title: "Browse a verified card",
  },
  {
    body: "Use checkout to capture recipient context and, when Stripe test mode is configured, send the buyer through sandbox payment without live charges.",
    cta: "Open checkout",
    href: "/checkout?demo=1",
    kicker: "Buyer",
    title: "Create the gift order",
  },
  {
    body: "Open the seeded reveal with code AWO-DEMO-001 and PIN 1234 to show artist story, custody, payment evidence, and pending ownership posture.",
    cta: "Open reveal",
    href: "/reveal?code=AWO-DEMO-001&demo=1",
    kicker: "Recipient",
    title: "Unlock the playback",
  },
  {
    body: "Use protected admin pages to show that the emotional recipient experience is backed by lifecycle checks, custody events, ownership records, and reconciliation.",
    cta: "Open reconciliation",
    href: "/admin/reconciliation",
    kicker: "Operator",
    title: "Verify the proof layer",
  },
];

const proofLinks = [
  { href: "/admin/ops", label: "Admin Ops" },
  { href: "/admin/custody", label: "Custody Events" },
  { href: "/admin/ownership", label: "Ownership Records" },
  { href: "/admin/reconciliation", label: "Reconciliation" },
  { href: "/admin/launch", label: "Launch Readiness" },
];

const reviewCues = [
  "Can a buyer understand why this card is different from a generic greeting card?",
  "Does the recipient reveal feel like a gift moment before it becomes a proof dashboard?",
  "Can an artist see how AWO protects their story and provenance?",
  "Can an operator prove the lifecycle without asking engineering to inspect the database?",
];

export default function DemoWalkthroughPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="home" />

      <section className="border-b border-[#e5ded6] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px] lg:px-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
              Stakeholder walkthrough
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
              Show the AWO story from card discovery to proof.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4b4743]">
              This page is a guided demo path for investors, artists, and early
              partners. It keeps the story tight: shopper intent, recipient
              playback, and the operational evidence behind the reveal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <DemoStartButton />
              <a
                className="inline-flex h-12 items-center justify-center border border-[#dfd5ca] bg-white px-6 text-sm font-black uppercase tracking-wide text-[#373431] hover:border-[#b7653a] hover:text-[#a85f38]"
                href="/shop/wildflower-notes"
              >
                Review Card First
              </a>
              <a
                className="inline-flex h-12 items-center justify-center border border-[#b7653a] bg-white px-6 text-sm font-black uppercase tracking-wide text-[#7a472e] hover:bg-[#fff8f3]"
                href="/reveal?code=AWO-DEMO-001&demo=1"
              >
                Open Demo Reveal
              </a>
            </div>
          </div>

          <aside className="border border-[#e5ded6] bg-[#fff8ef] p-6">
            <p className="text-sm font-black uppercase tracking-wide text-[#7a472e]">
              Demo-safe credentials
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-black text-[#373431]">Reveal code</dt>
                <dd className="mt-1 font-bold text-[#4b4743]">AWO-DEMO-001</dd>
              </div>
              <div>
                <dt className="font-black text-[#373431]">Reveal PIN</dt>
                <dd className="mt-1 font-bold text-[#4b4743]">1234</dd>
              </div>
              <div>
                <dt className="font-black text-[#373431]">Stripe sandbox card</dt>
                <dd className="mt-1 font-bold text-[#4b4743]">
                  4242 4242 4242 4242
                </dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-[#e3c8ae] pt-4 text-xs font-bold leading-5 text-[#6f3a1f]">
              Use these only for sandbox walkthroughs. The demo is designed to
              prove the experience without charging a card or exposing live
              recipient data.
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-4">
          {journey.map((step, index) => (
            <article
              className="border border-[#e5ded6] bg-white p-5 shadow-[0_18px_45px_rgba(45,38,32,.05)]"
              key={step.title}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                  {step.kicker}
                </span>
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#252525] text-sm font-black text-white">
                  {index + 1}
                </span>
              </div>
              <h2 className="mt-5 text-xl font-black">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#4b4743]">{step.body}</p>
              <a
                className="mt-5 inline-flex h-10 items-center justify-center border border-[#dfd5ca] px-4 text-xs font-black uppercase tracking-wide text-[#373431] hover:border-[#b7653a] hover:text-[#a85f38]"
                href={step.href}
              >
                {step.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#e5ded6] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_420px] lg:px-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
              What good looks like
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-normal">
              The demo should feel personal first, provable second.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#4b4743]">
              The recipient reveal is the emotional center. The admin pages are
              there to prove the system is not hand-wavy: payments, credentials,
              custody events, ownership records, and reconciliation all tell the
              same story.
            </p>
            <div className="mt-6 grid gap-3">
              {reviewCues.map((cue) => (
                <div
                  className="border border-[#e5ded6] bg-[#fbfaf8] p-4 text-sm font-bold leading-6 text-[#373431]"
                  key={cue}
                >
                  {cue}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {proofLinks.map((link) => (
              <a
                className="inline-flex min-h-12 items-center justify-center border border-[#dfd5ca] bg-[#fbfaf8] px-4 text-center text-sm font-black text-[#373431] hover:border-[#b7653a] hover:text-[#a85f38]"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
