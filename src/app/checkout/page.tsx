export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
            AWO
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Checkout Shell
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
        <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4">
            <label className="block text-sm font-semibold text-slate-700">
              Recipient Name
              <input
                className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                placeholder="Who is this for?"
                type="text"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Occasion
              <input
                className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                placeholder="Birthday, support, thank you..."
                type="text"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Message Notes
              <textarea
                className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Draft a note or leave guidance for the final experience."
              />
            </label>
          </div>

          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            Payments are intentionally disabled in V0.2. Real Stripe charges
            stay in Parking Lot / Future until the checkout model is reviewed.
          </div>

          <button
            className="mt-5 h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            type="button"
          >
            Save Checkout Draft
          </button>
        </form>
      </section>
    </main>
  );
}
