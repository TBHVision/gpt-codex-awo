import Link from "next/link";
import {
  type LaunchReadinessItem,
  loadLaunchReadinessSnapshot,
} from "@/lib/launch-readiness";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (value === null) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function badgeClass(state: LaunchReadinessItem["state"]) {
  if (state === "ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (state === "review") {
    return "border-blue-200 bg-blue-50 text-blue-900";
  }

  if (state === "watch") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-rose-200 bg-rose-50 text-rose-950";
}

function stateLabel(state: LaunchReadinessItem["state"]) {
  if (state === "ready") {
    return "Ready";
  }

  if (state === "review") {
    return "Needs Tony";
  }

  if (state === "watch") {
    return "Watch";
  }

  return "Blocked";
}

export default async function AdminLaunchPage() {
  const snapshot = await loadLaunchReadinessSnapshot();

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              GPT-Codex AWO
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Launch Readiness
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              V1.0 is not complete until every prior gate is done or deliberately
              deferred, release evidence is green, and Tony accepts the remaining
              launch risks in Linear.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Snapshot: {formatDate(snapshot.generatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/admin/fulfillment"
            >
              Fulfillment Queue
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/admin/audit"
            >
              Audit Log
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/admin/reviews"
            >
              Review Queues
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/admin/ops"
            >
              Admin Ops
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
        <section className="min-w-0 space-y-6">
          {snapshot.sections.map((section) => (
            <div
              className="min-w-0 rounded-lg border border-slate-200 bg-white p-5"
              key={section.title}
            >
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="mt-4 grid gap-3">
                {section.items.map((item) => (
                  <article
                    className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4"
                    key={`${section.title}-${item.label}`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold">{item.label}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {item.detail}
                        </p>
                      </div>
                      <span
                        className={`inline-flex h-fit w-fit rounded-md border px-3 py-1.5 text-xs font-semibold ${badgeClass(
                          item.state,
                        )}`}
                      >
                        {stateLabel(item.state)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>

        <aside className="min-w-0 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">V1.0 Rollup</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <p className="text-sm font-semibold">Ready</p>
                <p className="mt-1 text-3xl font-semibold">
                  {snapshot.headline.ready}
                </p>
              </div>
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-900">
                <p className="text-sm font-semibold">Needs Tony</p>
                <p className="mt-1 text-3xl font-semibold">
                  {snapshot.headline.review}
                </p>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">
                <p className="text-sm font-semibold">Watch</p>
                <p className="mt-1 text-3xl font-semibold">
                  {snapshot.headline.watch}
                </p>
              </div>
              <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-950">
                <p className="text-sm font-semibold">Blocked</p>
                <p className="mt-1 text-3xl font-semibold">
                  {snapshot.headline.blocked}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Latest Release Gate</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Status:{" "}
              <span className="font-semibold capitalize">
                {snapshot.releaseEvidence.status}
              </span>
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Finished: {formatDate(snapshot.releaseEvidence.finishedAt)}
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-semibold text-amber-950">
              Launch Rule
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Linear AWO-63 stays open until all human gates are complete or
              Tony explicitly accepts a deferral. This page supports the review;
              it does not replace Linear.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
