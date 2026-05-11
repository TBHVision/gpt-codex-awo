import Link from "next/link";
import { AdminSessionBanner } from "@/app/admin/AdminSessionBanner";
import {
  type ReconciliationMetric,
  loadAdminReconciliationSnapshot,
} from "@/lib/admin-reconciliation";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function stateClass(state: ReconciliationMetric["state"]) {
  if (state === "healthy") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (state === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-rose-200 bg-rose-50 text-rose-950";
}

function severityClass(severity: "blocked" | "healthy" | "warning") {
  if (severity === "blocked") {
    return "border-rose-200 bg-rose-50 text-rose-950";
  }

  if (severity === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-flex w-fit rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
      {value.replace(/_/g, " ")}
    </span>
  );
}

export default async function AdminReconciliationPage() {
  const snapshot = await loadAdminReconciliationSnapshot();

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              GPT-Codex AWO
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Lifecycle Reconciliation
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Read-only checks for mismatches between paid order items,
              fulfillment state, custody events, and ownership records.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Snapshot: {formatDate(snapshot.generatedAt)} -{" "}
              {snapshot.mode === "full"
                ? "Full reconciliation mode"
                : "Limited reconciliation mode"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AdminSessionBanner />
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/admin/ownership"
            >
              Ownership Records
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/admin/custody"
            >
              Custody Events
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
          <h2 className="text-xl font-semibold">Mismatch Queue</h2>
          <div className="mt-4 divide-y divide-slate-200">
            {snapshot.issues.length > 0 ? (
              snapshot.issues.map((issue) => (
                <article className="py-5" key={issue.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-md border px-3 py-1 text-xs font-semibold ${severityClass(
                            issue.severity,
                          )}`}
                        >
                          {issue.severity === "blocked" ? "Blocked" : "Watch"}
                        </span>
                        <h3 className="break-words text-lg font-semibold">
                          {issue.issueType}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {issue.detail}
                      </p>
                      <p className="mt-2 break-words text-sm text-slate-500">
                        {issue.cardTitle} - {issue.artistName}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-500">
                        {issue.checkoutReference}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <StatusPill value={issue.paymentStatus} />
                      <StatusPill value={issue.itemStatus} />
                    </div>
                  </div>
                  <p className="mt-3 break-all rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                    Reveal: {issue.revealPublicId}
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                No lifecycle mismatches were found in the latest sampled order
                items.
              </p>
            )}
          </div>
        </section>

        <aside className="min-w-0 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Reconciliation Health</h2>
            <div className="mt-4 grid min-w-0 gap-3">
              {snapshot.metrics.map((item) => (
                <div
                  className={`min-w-0 rounded-md border p-4 ${stateClass(item.state)}`}
                  key={item.label}
                >
                  <p className="break-words text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 break-all text-2xl font-semibold">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-semibold text-amber-950">
              Reconciliation Guardrail
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              This page detects drift. It does not repair records, replay
              custody events, fulfill items, or change ownership.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
