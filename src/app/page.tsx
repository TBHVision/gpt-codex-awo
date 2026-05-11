import Link from "next/link";
import StorefrontNav from "@/app/components/StorefrontNav";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="home" />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_45%,#f4f0ea_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
            ArtWithOrigin
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl text-5xl font-black leading-none tracking-tight sm:text-7xl">
            Human art with a story you can verify.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#4b4743]">
            AWO connects greeting cards, artist stories, QR + PIN reveal, and
            provenance evidence into one trustable gifting experience.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <form action="/shop">
              <button
                className="inline-flex h-12 items-center justify-center bg-[#252525] px-6 text-sm font-black uppercase tracking-wide text-white hover:bg-[#3a3632]"
                type="submit"
              >
                Shop Cards
              </button>
            </form>
            <Link
              className="inline-flex h-12 items-center justify-center border border-[#b7653a] bg-white px-6 text-sm font-black uppercase tracking-wide text-[#7a472e] hover:bg-[#fff8f3]"
              href="/reveal"
            >
              Preview Reveal
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-10 md:grid-cols-3 lg:px-10">
        {[
          {
            title: "Shop verified cards",
            body: "Browse artwork-backed cards and see the creator behind each piece.",
          },
          {
            title: "Reveal the origin",
            body: "Use QR + PIN flows to unlock the artist story and provenance trail.",
          },
          {
            title: "Plan better gifting",
            body: "Use People and Reminders to keep meaningful moments from slipping by.",
          },
        ].map((item) => (
          <article
            className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]"
            key={item.title}
          >
            <h2 className="text-xl font-black">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#4b4743]">{item.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
