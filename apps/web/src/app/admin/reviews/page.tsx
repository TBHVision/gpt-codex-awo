import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";
import { AdminSessionBanner } from "@/app/admin/AdminSessionBanner";
import { reviewCard, type CardReviewAction } from "@/lib/admin-card-review";
import {
  type ReviewMetric,
  loadAdminReviewQueues,
} from "@/lib/admin-review-queues";

export const dynamic = "force-dynamic";

const adminUserCookieName = "awo_admin_user_id";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function stateClass(state: ReviewMetric["state"]) {
  if (state === "healthy") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (state === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-rose-200 bg-rose-50 text-rose-950";
}

function MetricGrid({ items, title }: { items: ReviewMetric[]; title: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      {items.length > 0 ? (
        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div
              className={`min-w-0 rounded-md border p-4 ${stateClass(item.state)}`}
              key={`${title}-${item.label}`}
            >
              <p className="break-words text-sm font-semibold capitalize">{item.label}</p>
              <p className="mt-1 break-all text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Metrics require server-only Supabase service-role access.
        </p>
      )}
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-flex w-fit rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
      {value.replace(/_/g, " ")}
    </span>
  );
}

async function submitCardReview(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const adminUserId = cookieStore.get(adminUserCookieName)?.value;
  const action = String(formData.get("action") ?? "") as CardReviewAction;
  const cardId = String(formData.get("cardId") ?? "");

  if ((action !== "approve" && action !== "reject") || !cardId) {
    throw new Error("Invalid card review action.");
  }

  await reviewCard({ action, adminUserId, cardId });
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/ops");
}

export default async function AdminReviewsPage() {
  const snapshot = await loadAdminReviewQueues();
  const cookieStore = await cookies();
  const hasNamedAdmin = Boolean(cookieStore.get(adminUserCookieName)?.value);

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              GPT-Codex AWO
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Admin Review Queues
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Read-only launch review queues for cards, artists, orders, and
              reveal credentials. Approval actions stay out until role-based
              admin auth and audit trails are ready.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Snapshot: {formatDate(snapshot.generatedAt)} -{" "}
              {snapshot.mode === "full" ? "Full review mode" : "Limited review mode"}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Review actions: {hasNamedAdmin ? "Named admin enabled" : "Read-only until Supabase admin login"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AdminSessionBanner />
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
              href="/admin/ops"
            >
              Admin Ops
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

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_360px]">
        <section className="min-w-0 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">Card Review Queue</h2>
            <div className="mt-4 divide-y divide-slate-200">
              {snapshot.cards.length > 0 ? (
                snapshot.cards.map((card) => (
                  <article className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]" key={card.slug}>
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold">{card.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {card.artist} - {card.price}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Updated {formatDate(card.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <StatusPill value={card.status} />
                      {card.status === "pending_review" ? (
                        <form action={submitCardReview} className="flex flex-wrap gap-2">
                          <input name="cardId" type="hidden" value={card.id} />
                          <button
                            className="h-9 rounded-md border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!hasNamedAdmin}
                            name="action"
                            type="submit"
                            value="approve"
                          >
                            Approve
                          </button>
                          <button
                            className="h-9 rounded-md border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!hasNamedAdmin}
                            name="action"
                            type="submit"
                            value="reject"
                          >
                            Reject
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  No card rows are visible in the current review mode.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">Artist Review Queue</h2>
            <div className="mt-4 divide-y divide-slate-200">
              {snapshot.artists.length > 0 ? (
                snapshot.artists.map((artist) => (
                  <article className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]" key={artist.slug}>
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold">{artist.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Updated {formatDate(artist.updatedAt)}
                      </p>
                    </div>
                    <StatusPill value={artist.status} />
                  </article>
                ))
              ) : (
                <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  No artist rows are visible in the current review mode.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <div className="mt-4 divide-y divide-slate-200">
              {snapshot.orders.length > 0 ? (
                snapshot.orders.map((order) => (
                  <article
                    className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]"
                    key={`${order.checkoutReference}-${order.createdAt}`}
                  >
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold">
                        {order.checkoutReference}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {order.recipientName} - {order.total}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Created {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <StatusPill value={order.status} />
                      <StatusPill value={order.paymentStatus} />
                      <StatusPill value={order.fulfillmentStatus} />
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  No order rows are visible in the current review mode.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">Reveal Credential Review</h2>
            <div className="mt-4 divide-y divide-slate-200">
              {snapshot.reveals.length > 0 ? (
                snapshot.reveals.map((reveal) => (
                  <article
                    className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]"
                    key={`${reveal.revealPublicId}-${reveal.updatedAt}`}
                  >
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold">
                        {reveal.revealPublicId}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {reveal.cardTitle} - {reveal.failedAttempts} failed attempts
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Updated {formatDate(reveal.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <StatusPill value={reveal.status} />
                      <StatusPill value={reveal.credentialStatus} />
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  No reveal rows are visible in the current review mode.
                </p>
              )}
            </div>
          </div>
        </section>

        <aside className="min-w-0 space-y-6">
          <MetricGrid items={snapshot.health} title="Review Health" />
          <MetricGrid items={snapshot.cardStatus} title="Card Status" />
          <MetricGrid items={snapshot.artistStatus} title="Artist Status" />

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-semibold text-amber-950">
              Read-Only Rule
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Card approve/reject actions require Supabase-backed named admin
              login and write an audit event. Temporary password sessions stay
              read-only.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
