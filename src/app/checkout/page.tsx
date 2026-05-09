import Link from "next/link";

function LineIcon({ kind }: { kind: "cart" | "search" | "user" }) {
  const paths = {
    cart: "M6 6h15l-2 8H8L6 3H3 M9 20h.1 M18 20h.1",
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

function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e6e0d9] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link
          className="inline-flex items-center gap-1.5 font-black tracking-tight text-[#8b4f2c]"
          href="/shop"
        >
          <span className="text-2xl">AW</span>
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,#c98a55_0,#8b4f2c_45%,#5a311b_100%)] text-xs text-[#f8efe4] shadow-[inset_0_0_0_3px_rgba(255,255,255,.2)]">
            O
          </span>
        </Link>
        <nav className="hidden items-center gap-14 text-sm font-bold uppercase tracking-wide text-[#2b2927] md:flex">
          {["Shop", "Artists", "How It Works", "About"].map((item) => (
            <Link className="py-7 hover:text-[#a85f38]" href="/shop" key={item}>
              {item}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-[#252525]">
          <LineIcon kind="search" />
          <LineIcon kind="user" />
          <Link
            aria-label="Cart"
            className="inline-flex size-9 items-center justify-center"
            href="/cart"
          >
            <LineIcon kind="cart" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <TopNav />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_48%,#f4f0ea_100%)]">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
            V0.2 checkout shell
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Checkout Draft
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4b4743]">
            Capture recipient and occasion intent now. Real payment and order
            capture stay disabled until the checkout model moves out of Parking
            Lot / Future.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1fr_300px] lg:px-10">
        <form className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
          <div className="grid gap-5">
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Recipient Name
              <input
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                placeholder="Who is this for?"
                type="text"
              />
            </label>
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Occasion
              <input
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                placeholder="Birthday, support, thank you..."
                type="text"
              />
            </label>
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Message Notes
              <textarea
                className="mt-2 min-h-32 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 py-2 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                placeholder="Draft a note or leave guidance for the final experience."
              />
            </label>
          </div>

          <button
            className="mt-6 h-12 w-full bg-[#252525] px-4 text-sm font-black uppercase tracking-wide text-white hover:bg-[#3a3632]"
            type="button"
          >
            Save Checkout Draft
          </button>
        </form>

        <aside className="h-fit border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
          <h2 className="text-xl font-black">No Payment Yet</h2>
          <p className="mt-3 text-sm leading-6 text-[#4b4743]">
            This shell deliberately avoids Stripe or any live charge path. It
            lets us shape the buying experience before money movement enters
            the system.
          </p>
          <Link
            className="mt-6 inline-flex h-11 w-full items-center justify-center border border-[#dfd5ca] bg-white px-4 text-sm font-black uppercase tracking-wide text-[#b7653a] hover:border-[#b7653a]"
            href="/cart"
          >
            Back to Cart
          </Link>
        </aside>
      </section>
    </main>
  );
}
