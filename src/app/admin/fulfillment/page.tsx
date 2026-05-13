import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { AdminSessionBanner } from "@/app/admin/AdminSessionBanner";
import {
  generateRevealCredential,
  transitionFulfillmentItem,
  type FulfillmentTransitionStatus,
  type GeneratedRevealCredential,
} from "@/lib/admin-fulfillment-actions";
import {
  transitionLifecycleException,
  type LifecycleExceptionAction,
} from "@/lib/admin-lifecycle-actions";
import {
  adminUserCookieName,
  verifyAdminUserCookie,
} from "@/lib/admin-session";
import {
  type FulfillmentMetric,
  loadAdminFulfillmentSnapshot,
} from "@/lib/admin-fulfillment";

export const dynamic = "force-dynamic";

const recentCredentialCookieName = "awo_recent_reveal_credential";

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

function parseRecentCredential(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as GeneratedRevealCredential;
  } catch {
    return null;
  }
}

function nextTransitions(status: string) {
  if (status === "reserved") {
    return [{ label: "Move To Purchased", value: "purchased" as const }];
  }

  if (status === "purchased") {
    return [{ label: "Start Credential Work", value: "credential_pending" as const }];
  }

  if (status === "credential_active" || status === "revealed") {
    return [{ label: "Mark Fulfilled", value: "completed" as const }];
  }

  return [];
}

async function submitFulfillmentTransition(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const adminUserId = await verifyAdminUserCookie(
    cookieStore.get(adminUserCookieName)?.value,
  );
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

  await transitionFulfillmentItem({
    adminUserId: adminUserId ?? undefined,
    itemId,
    nextStatus,
  });
  revalidatePath("/admin/fulfillment");
  revalidatePath("/admin/ownership");
  revalidatePath("/admin/audit");
  revalidatePath("/admin/ops");
  revalidatePath("/admin/launch");
}

async function submitCredentialGeneration(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const adminUserId = await verifyAdminUserCookie(
    cookieStore.get(adminUserCookieName)?.value,
  );
  const itemId = String(formData.get("itemId") ?? "");

  if (!itemId) {
    throw new Error("Invalid credential generation request.");
  }

  const credential = await generateRevealCredential({
    adminUserId: adminUserId ?? undefined,
    itemId,
  });

  if (!credential) {
    throw new Error("Reveal credential generation did not return a credential.");
  }

  cookieStore.set(recentCredentialCookieName, JSON.stringify(credential), {
    httpOnly: true,
    maxAge: 600,
    path: "/admin/fulfillment",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/admin/fulfillment");
  revalidatePath("/admin/custody");
  revalidatePath("/admin/reconciliation");
  revalidatePath("/admin/audit");
  revalidatePath("/admin/ops");
  revalidatePath("/admin/launch");
}

async function submitLifecycleException(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const adminUserId = await verifyAdminUserCookie(
    cookieStore.get(adminUserCookieName)?.value,
  );
  const itemId = String(formData.get("itemId") ?? "");
  const action = String(formData.get("action") ?? "") as LifecycleExceptionAction;

  if (!itemId || !["refund_item", "revoke_credential"].includes(action)) {
    throw new Error("Invalid lifecycle exception action.");
  }

  await transitionLifecycleException({
    action,
    adminUserId: adminUserId ?? undefined,
    itemId,
    note:
      action === "refund_item"
        ? "Internal refund state recorded from /admin/fulfillment. No live Stripe refund was executed."
        : "Reveal credential revoked from /admin/fulfillment.",
  });

  revalidatePath("/admin/fulfillment");
  revalidatePath("/admin/ownership");
  revalidatePath("/admin/custody");
  revalidatePath("/admin/reconciliation");
  revalidatePath("/admin/audit");
  revalidatePath("/admin/ops");
  revalidatePath("/admin/launch");
}

export default async function AdminFulfillmentPage() {
  const snapshot = await loadAdminFulfillmentSnapshot();
  const cookieStore = await cookies();
  const hasNamedAdmin = Boolean(
    await verifyAdminUserCookie(cookieStore.get(adminUserCookieName)?.value),
  );
  const recentCredential = parseRecentCredential(
    cookieStore.get(recentCredentialCookieName)?.value,
  );

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
              Paid orders, item state, reveal credential readiness, and
              ownership posture. Named admins can generate QR/PIN credential
              packets and run narrow exception workflows. Refund actions record
              internal state only; live Stripe refunds stay disabled.
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
          {recentCredential ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
              <p className="text-sm font-black uppercase tracking-[0.12em]">
                Credential Packet
              </p>
              <p className="mt-2 text-sm leading-6">
                Give this one-time packet to print or fulfillment. The raw PIN is
                not stored after generation.
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-emerald-200 bg-white/70 p-3">
                  <dt className="text-xs font-semibold uppercase text-emerald-800">
                    Order item
                  </dt>
                  <dd className="mt-1 break-all text-sm font-semibold">
                    {recentCredential.order_item_id}
                  </dd>
                </div>
                <div className="rounded-md border border-emerald-200 bg-white/70 p-3">
                  <dt className="text-xs font-semibold uppercase text-emerald-800">
                    Reveal code
                  </dt>
                  <dd className="mt-1 break-all text-lg font-black">
                    {recentCredential.reveal_public_id}
                  </dd>
                </div>
                <div className="rounded-md border border-emerald-200 bg-white/70 p-3">
                  <dt className="text-xs font-semibold uppercase text-emerald-800">
                    PIN
                  </dt>
                  <dd className="mt-1 text-lg font-black">
                    {recentCredential.reveal_pin}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
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
                            {["purchased", "credential_pending"].includes(
                              item.itemStatus,
                            ) ? (
                              <form action={submitCredentialGeneration}>
                                <input name="itemId" type="hidden" value={item.id} />
                                <button
                                  className="h-9 rounded-md border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-900 shadow-sm hover:border-emerald-400 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={!hasNamedAdmin}
                                  type="submit"
                                >
                                  Generate QR/PIN
                                </button>
                              </form>
                            ) : null}
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
                            {item.revealCredentialStatus !== "revoked" &&
                            item.revealCredentialStatus !== "no credential" ? (
                              <form action={submitLifecycleException}>
                                <input name="itemId" type="hidden" value={item.id} />
                                <input
                                  name="action"
                                  type="hidden"
                                  value="revoke_credential"
                                />
                                <button
                                  className="h-9 rounded-md border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-950 shadow-sm hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={!hasNamedAdmin}
                                  type="submit"
                                >
                                  Revoke Credential
                                </button>
                              </form>
                            ) : null}
                            {["paid", "partially_refunded"].includes(
                              order.paymentStatus,
                            ) && item.itemStatus !== "refunded" ? (
                              <form action={submitLifecycleException}>
                                <input name="itemId" type="hidden" value={item.id} />
                                <input
                                  name="action"
                                  type="hidden"
                                  value="refund_item"
                                />
                                <button
                                  className="h-9 rounded-md border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-900 shadow-sm hover:border-rose-400 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={!hasNamedAdmin}
                                  type="submit"
                                >
                                  Record Refund
                                </button>
                              </form>
                            ) : null}
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
              This page exposes narrow named-admin transitions. Record Refund is
              internal lifecycle state only and does not execute a live Stripe
              refund.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
