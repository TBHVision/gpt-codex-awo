import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { AdminSessionBanner } from "@/app/admin/AdminSessionBanner";
import {
  transitionFulfillmentItem,
  type FulfillmentTransitionStatus,
} from "@/lib/admin-fulfillment-actions";
import {
  type FulfillmentMetric,
  loadAdminFulfillmentSnapshot,
} from "@/lib/admin-fulfillment";

export const dynamic = "force-dynamic";

const adminUserCookieName = "awo_admin_user_id";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function stateClass(state: FulfillmentMetric["state"]) {
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

function nextTransitions(status: string) {
  if (status === "reserved") {
    return [{ label: "Move To Purchased", value: "purchased" as const }];
  }

  if (status === "purchased") {
    return [
      { label: "Start Credential Work", value: "credential_pending" as const },
      { label: "Mark Credential Active", value: "credential_active" as const },
    ];
  }

  if (status === "credential_pending") {
    return [{ label: "Mark Credential Active", value: "credential_active" as const }];
  }

  if (status === "credential_active" || status === "revealed") {
    return [{ label: "Mark Fulfilled", value: "completed" as const }];
  }

  return [];
}

async function submitFulfillmentTransition(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const adminUserId = cookieStore.get(adminUserCookieName)?.value;
  const itemId = String(formData.get("itemId") ?? "");
  const nextStatus = String(
    formData.get("nextStatus") ?? "",
  ) as FulfillmentTransitionStatus;

  if (
    !itemId ||
    !["purchased", "credential_pending", "credential_active", "completed"].includes(
      nextStatus,
    )
  ) {
    throw new Error("Invalid fulfillment transition.");
  }

  await transitionFulfillmentItem({ adminUserId, itemId, nextStatus });
  revalidatePath("/admin/fulfillment");
  revalidatePath("/admin/ownership");
  revalidatePath("/admin/audit");
  revalidatePath("/admin/ops");
  revalidatePath("/admin/launch");
}

export default async function AdminFulfillmentPage() {
  const snapshot = await loadAdminFulfillmentSnapshot();
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
              Fulfillment Queue
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Read-only view of paid orders, item state, reveal credential
              readiness, and ownership posture. Fulfillment actions stay out
              until policy, audit, and operator flow are deliberately scoped.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Snapshot: {formatDate(snapshot.generatedAt)} -{" "}
              {snapshot.mode === "full"
                ? "Full fulfillment mode"
                : "Limited fulfillment mode"}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Actions:{" "}
              {hasNamedAdmin
                ? "Named admin transitions enabled"
                : "Read-only until Supabase admin login"}
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
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/admin/reconciliation"
            >
              Reconciliation
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/admin/audit"
            >
              Audit Log
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
          <h2 className="text-xl font-semibold">Paid And Pending Orders</h2>
          <div className="mt-4 divide-y divide-slate-200">
            {snapshot.orders.length > 0 ? (
              snapshot.orders.map((order) => (
                <article className="py-5" key={`${order.checkoutReference}-${order.createdAt}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                  </div>

                  <div className="mt-4 grid gap-3">
                    {order.items.length > 0 ? (
                      order.items.map((item) => (
                        <div
                          className="rounded-md border border-slate-200 bg-slate-50 p-4"
                          key={`${order.checkoutReference}-${item.revealPublicId}`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h4 className="break-words font-semibold">
                                {item.cardTitle}
                              </h4>
                              <p className="mt-1 break-words text-sm text-slate-600">
                                {item.artistName} - Qty {item.quantity}
                              </p>
                              <p className="mt-1 break-all text-sm text-slate-500">
                                Reveal: {item.revealPublicId}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:justify-end">
                              <StatusPill value={item.itemStatus} />
                              <StatusPill value={item.revealCredentialStatus} />
                              <StatusPill value={`ownership ${item.ownershipStatus}`} />
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {nextTransitions(item.itemStatus).length > 0 ? (
                              nextTransitions(item.itemStatus).map((action) => (
                                <form action={submitFulfillmentTransition} key={`${item.id}-${action.value}`}>
                                  <input name="itemId" type="hidden" value={item.id} />
                                  <input
                                    name="nextStatus"
                                    type="hidden"
                                    value={action.value}
                                  />
                                  <button
                                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={!hasNamedAdmin}
                                    type="submit"
                                  >
                                    {action.label}
                                  </button>
                                </form>
                              ))
                            ) : (
                              <p className="text-xs font-semibold text-slate-500">
                                No fulfillment transition available.
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        No order items are visible for this order.
                      </p>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                No paid or pending fulfillment orders are visible in the current mode.
              </p>
            )}
          </div>
        </section>

        <aside className="min-w-0 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Fulfillment Health</h2>
            <div className="mt-4 grid min-w-0 gap-3">
              {snapshot.health.map((item) => (
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
              Fulfillment Rule
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              This page does not fulfill, ship, revoke, refund, or transfer
              ownership. Those actions need separate audited workflows.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
