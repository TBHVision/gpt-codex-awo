/* eslint-disable @next/next/no-html-link-for-pages */

import Image from "next/image";
import StorefrontNav from "@/app/components/StorefrontNav";

const proofPoints = [
  "Authentic human creation",
  "Verified provenance",
  "QR + PIN reveal",
  "Ownership you can trust",
];

const journeys = [
  {
    body: "Browse published cards, open Wildflower Notes, and see how artist story and trust markers sit directly in the buying path.",
    cta: "Shop Cards",
    href: "/shop",
    label: "Shopper",
    title: "Find a verified card",
  },
  {
    body: "Review the creator profile and the cards tied to HatchVision Studio so an artist can see how AWO presents their work.",
    cta: "View Artist Story",
    href: "/artists/hatchvision-studio",
    label: "Artist",
    title: "See the creator layer",
  },
  {
    body: "Use the seeded demo reveal to show the honoree playback, sender note, custody timeline, and ownership posture.",
    cta: "Open Reveal",
    href: "/reveal?code=AWO-DEMO-001&demo=1",
    label: "Recipient",
    title: "Unlock the gift story",
  },
  {
    body: "Open the guided stakeholder walkthrough when you need the full discovery, checkout, reveal, and proof sequence.",
    cta: "Run Demo",
    href: "/demo",
    label: "Investor",
    title: "Follow the proof path",
  },
];

const operations = [
  { href: "/admin/reconciliation", label: "Lifecycle reconciliation" },
  { href: "/admin/ownership", label: "Ownership records" },
  { href: "/admin/custody", label: "Custody events" },
  { href: "/admin/launch", label: "Launch readiness" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="home" />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_48%,#f4f0ea_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1fr_420px] lg:items-center lg:px-10 lg:py-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
              ArtWithOrigin
            </p>
            <div className="mt-6 max-w-[340px] sm:max-w-[430px]">
              <Image
                alt="ArtWithOrigin"
                className="h-auto w-full object-contain"
                height={232}
                priority
                src="/awo-logo.png"
                width={440}
              />
            </div>
            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
              Human art with a story you can verify.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4b4743]">
              AWO turns greeting cards into verified gift experiences: shop the
              art, learn the artist, reveal the origin, and preserve the
              ownership trail.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="inline-flex h-12 items-center justify-center bg-[#252525] px-6 text-sm font-black uppercase tracking-wide text-white hover:bg-[#3a3632]"
                href="/shop"
              >
                Shop Cards
              </a>
              <a
                className="inline-flex h-12 items-center justify-center border border-[#b7653a] bg-white px-6 text-sm font-black uppercase tracking-wide text-[#7a472e] hover:bg-[#fff8f3]"
                href="/demo"
              >
                Demo Walkthrough
              </a>
            </div>
          </div>

          <aside className="border border-[#e5ded6] bg-white p-6 shadow-[0_24px_60px_rgba(45,38,32,.08)]">
            <p className="text-sm font-black uppercase tracking-wide text-[#7a472e]">
              Review path
            </p>
            <div className="mt-5 grid gap-3">
              <a
                className="flex min-h-12 items-center justify-between border border-[#dfd5ca] px-4 text-sm font-black hover:border-[#b7653a] hover:text-[#a85f38]"
                href="/shop/wildflower-notes"
              >
                Wildflower Notes product
                <span aria-hidden="true">+</span>
              </a>
              <a
                className="flex min-h-12 items-center justify-between border border-[#dfd5ca] px-4 text-sm font-black hover:border-[#b7653a] hover:text-[#a85f38]"
                href="/checkout?demo=1"
              >
                Demo checkout
                <span aria-hidden="true">+</span>
              </a>
              <a
                className="flex min-h-12 items-center justify-between border border-[#dfd5ca] px-4 text-sm font-black hover:border-[#b7653a] hover:text-[#a85f38]"
                href="/reveal?code=AWO-DEMO-001&demo=1"
              >
                Demo reveal
                <span aria-hidden="true">+</span>
              </a>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-[#e5ded6] pt-5 text-sm">
              <div>
                <dt className="font-black text-[#373431]">Reveal code</dt>
                <dd className="mt-1 font-bold text-[#4b4743]">AWO-DEMO-001</dd>
              </div>
              <div>
                <dt className="font-black text-[#373431]">PIN</dt>
                <dd className="mt-1 font-bold text-[#4b4743]">1234</dd>
              </div>
            </dl>
          </aside>
        </div>

        <div className="border-t border-[#efe8df] bg-white/70">
          <div className="mx-auto grid max-w-7xl gap-3 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
            {proofPoints.map((point) => (
              <div
                className="border border-[#e5ded6] bg-white px-4 py-3 text-xs font-black uppercase tracking-wide text-[#373431]"
                key={point}
              >
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
              Stakeholder paths
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-normal">
              Four ways to inspect the current product.
            </h2>
          </div>
          <a
            className="inline-flex h-11 items-center justify-center border border-[#dfd5ca] bg-white px-5 text-sm font-black uppercase tracking-wide text-[#373431] hover:border-[#b7653a] hover:text-[#a85f38]"
            href="/demo"
          >
            Full Guided Demo
          </a>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {journeys.map((item) => (
            <article
              className="flex min-h-[260px] flex-col border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]"
              key={item.title}
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                {item.label}
              </p>
              <h3 className="mt-4 text-xl font-black">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#4b4743]">
                {item.body}
              </p>
              <a
                className="mt-5 inline-flex h-10 items-center justify-center border border-[#dfd5ca] px-4 text-xs font-black uppercase tracking-wide text-[#373431] hover:border-[#b7653a] hover:text-[#a85f38]"
                href={item.href}
              >
                {item.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#e5ded6] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[1fr_520px] lg:px-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
              Operating proof
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-normal">
              The emotional gift path is backed by lifecycle checks.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#4b4743]">
              These protected views are for internal review. They show the
              payment, custody, ownership, and reconciliation posture behind
              the public story before AWO is shown to investors or onboarded
              artists.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {operations.map((item) => (
              <a
                className="inline-flex min-h-12 items-center justify-center border border-[#dfd5ca] bg-[#fbfaf8] px-4 text-center text-sm font-black text-[#373431] hover:border-[#b7653a] hover:text-[#a85f38]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#e5ded6] bg-[#2f2a26] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#d99a73]">
              Next validation
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-normal">
              Test the buyer flow, then replay the reveal.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex h-11 items-center justify-center bg-white px-5 text-sm font-black uppercase tracking-wide text-[#252525] hover:bg-[#f4f0ea]"
              href="/cart"
            >
              Open Cart
            </a>
            <a
              className="inline-flex h-11 items-center justify-center border border-[#d99a73] px-5 text-sm font-black uppercase tracking-wide text-white hover:bg-white/10"
              href="/account"
            >
              Buyer Account
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
