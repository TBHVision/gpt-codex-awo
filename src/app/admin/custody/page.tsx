import Link from "next/link";
import {
  type CustodyMetric,
  loadAdminCustodySnapshot,
} from "@/lib/admin-custody";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function stateClass(state: CustodyMetric["state"]) {
  if (state === "healthy") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (state === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-rose-200 bg-rose-50 text-rose-950";
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-flex w-fit rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
      {value.replace(/_/g, " ")}
    </span>
  );
}

export default async function AdminCustodyPage() {
  const snapshot = await loadAdminCustodySnapshot();

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              GPT-Codex AWO
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Custody Events
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Read-only provenance event trail for paid orders, reveal
              credentials, fulfilled items, and ownership recording.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Snapshot: {formatDate(snapshot.generatedAt)} -{" "}
              {snapshot.mode === "full"
                ? "Full custody mode"
                : "Limited custody mode"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/admin/ownership"
            >
              Ownership Records
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/admin/fulfillment"
            >
              Fulfillment Queue
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/admin/reconciliation"
            >
              Reconciliation
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              href="/admin/launch"
            >
              Launch Readiness
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_340px]">
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold">Recent Custody Events</h2>
          <div className="mt-4 divide-y divide-slate-200">
            {snapshot.events.length > 0 ? (
              snapshot.events.map((event) => (
                <article className="py-5" key={event.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold capitalize">
                        {event.eventType.replace(/_/g, " ")}
                      </h3>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {event.cardTitle} - {event.artistName}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-500">
                        Actor: {event.actorLabel}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-500">
                        Occurred: {formatDate(event.occurredAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <StatusPill value={event.paymentStatus} />
                      <StatusPill value={event.fulfillmentStatus} />
                      <StatusPill value={event.itemStatus} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Checkout
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-700">
                        {event.checkoutReference}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Reveal
                      </p>
                      <p className="mt-1 break-all text-sm text-slate-700">
                        {event.revealPublicId}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Payload
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-700">
                        {event.eventPayloadSummary}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                No custody events are visible in the current custody mode.
              </p>
            )}
          </div>
        </section>

        <aside className="min-w-0 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Custody Health</h2>
            <div className="mt-4 grid min-w-0 gap-3">
              {snapshot.health.map((item) => (
                <div
                  className={`min-w-0 rounded-md border p-4 ${stateClass(item.state)}`}
                  key={item.label}
                >
                  <p className="break-words text-sm font-semibold capitalize">
                    {item.label}
                  </p>
                  <p className="mt-1 break-all text-2xl font-semibold">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-semibold text-amber-950">
              Custody Guardrail
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              This page is evidence only. It does not edit events, replay
              events, fulfill items, or change ownership.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
