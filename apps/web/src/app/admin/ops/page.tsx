import Link from "next/link";
import { loadAdminOpsSnapshot } from "@/lib/admin-ops";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function stateClass(state: "blocked" | "healthy" | "warning") {
  if (state === "healthy") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (state === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-rose-200 bg-rose-50 text-rose-950";
}

export default async function AdminOpsPage() {
  const snapshot = await loadAdminOpsSnapshot();

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
              Read-only operational visibility from Supabase. Destructive admin
              controls stay out until approvals, fulfillment, and audit flows are
              deliberately designed.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Snapshot: {formatDate(snapshot.generatedAt)} ·{" "}
              {snapshot.mode === "full" ? "Full ops mode" : "Limited ops mode"}
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
            <h2 className="text-xl font-semibold">Order Metrics</h2>
            {snapshot.orderMetrics.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {snapshot.orderMetrics.map((metric) => (
                  <div
                    className={`rounded-md border p-4 ${stateClass(metric.state)}`}
                    key={metric.label}
                  >
                    <p className="text-sm font-semibold">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Order metrics require server-only Supabase service-role access.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <div className="mt-4 divide-y divide-slate-200">
              {snapshot.recentOrders.length > 0 ? (
                snapshot.recentOrders.map((order) => (
                  <article
                    className="grid gap-2 py-4 sm:grid-cols-[1fr_180px]"
                    key={order.id}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        {order.checkout_reference ?? order.id}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {order.recipient_name ?? "No recipient saved"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span className="h-fit rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                      {order.status}
                    </span>
                  </article>
                ))
              ) : (
                <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  No recent orders are visible in the current ops mode.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">Reveal Metrics</h2>
            {snapshot.revealMetrics.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {snapshot.revealMetrics.map((metric) => (
                  <div
                    className={`rounded-md border p-4 ${stateClass(metric.state)}`}
                    key={metric.label}
                  >
                    <p className="text-sm font-semibold">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Reveal metrics require server-only Supabase service-role access.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">System Health</h2>
            <div className="mt-4 space-y-3">
              {snapshot.health.map((item) => (
                <div
                  className={`rounded-md border p-4 ${stateClass(item.state)}`}
                  key={item.label}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-semibold text-amber-950">
              Operator Guardrail
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              This page is read-only. It does not approve cards, fulfill orders,
              send notifications, issue refunds, or change reveal state.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
