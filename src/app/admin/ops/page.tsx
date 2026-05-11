import Link from "next/link";

const orderQueue = [
  {
    customer: "Demo Buyer",
    item: "Wildflower Notes",
    status: "Ready for fulfillment review",
  },
  {
    customer: "Gift Sender",
    item: "Coastal Morning",
    status: "Awaiting reveal activation",
  },
  {
    customer: "Studio Preview",
    item: "Studio Demo Card",
    status: "Needs artist publish approval",
  },
];

const revealEvents = [
  "QR preview opened for Wildflower Notes",
  "PIN reveal shell tested for demo card",
  "Provenance timeline viewed from reveal page",
];

const systemHealth = [
  {
    label: "Supabase local wiring",
    state: "Healthy locally",
  },
  {
    label: "Vercel public env vars",
    state: "Healthy in production",
  },
  {
    label: "Fulfillment automation",
    state: "Future scope",
  },
];

export default function AdminOpsPage() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              GPT-Codex AWO
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Admin Operations
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              V0.6 shell for operational visibility. These queues are demo
              placeholders only; live fulfillment, refunds, notifications, and
              production controls are not wired yet.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/shop"
            >
              Storefront
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              href="/admin/build"
            >
              Project Home
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">Order Queue</h2>
            <div className="mt-4 divide-y divide-slate-200">
              {orderQueue.map((order) => (
                <article
                  className="grid gap-2 py-4 sm:grid-cols-[1fr_220px]"
                  key={`${order.customer}-${order.item}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {order.customer}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">{order.item}</h3>
                  </div>
                  <span className="h-fit rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    {order.status}
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">Reveal Events</h2>
            <div className="mt-4 space-y-3">
              {revealEvents.map((event) => (
                <p
                  className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  key={event}
                >
                  {event}
                </p>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">System Health</h2>
            <div className="mt-4 space-y-3">
              {systemHealth.map((item) => (
                <div
                  className="rounded-md border border-slate-200 bg-slate-50 p-4"
                  key={item.label}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.state}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-semibold text-amber-950">
              Operator Guardrail
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              This page is for visibility and workflow design only. Do not treat
              any queue state here as a live operational command.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
