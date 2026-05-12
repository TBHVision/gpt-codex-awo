import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { AdminSessionBanner } from "@/app/admin/AdminSessionBanner";
import {
  transitionLifecycleException,
  type LifecycleExceptionAction,
} from "@/lib/admin-lifecycle-actions";
import {
  type OwnershipMetric,
  loadAdminOwnershipSnapshot,
} from "@/lib/admin-ownership";

export const dynamic = "force-dynamic";

const adminUserCookieName = "awo_admin_user_id";

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function stateClass(state: OwnershipMetric["state"]) {
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

async function submitOwnershipException(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const adminUserId = cookieStore.get(adminUserCookieName)?.value;
  const itemId = String(formData.get("itemId") ?? "");
  const action = String(formData.get("action") ?? "") as LifecycleExceptionAction;
  const transferToPersonId = String(formData.get("transferToPersonId") ?? "").trim();
  const transferToProfileId = String(formData.get("transferToProfileId") ?? "").trim();

  if (!itemId || !["revoke_ownership", "transfer_ownership"].includes(action)) {
    throw new Error("Invalid ownership exception action.");
  }

  if (action === "transfer_ownership" && !transferToPersonId && !transferToProfileId) {
    throw new Error("Ownership transfer requires a target profile ID or person ID.");
  }

  await transitionLifecycleException({
    action,
    adminUserId,
    itemId,
    note:
      action === "transfer_ownership"
        ? "Ownership transfer recorded from /admin/ownership."
        : "Ownership revoked from /admin/ownership.",
    transferToPersonId,
    transferToProfileId,
  });

  revalidatePath("/admin/ownership");
  revalidatePath("/admin/custody");
  revalidatePath("/admin/reconciliation");
  revalidatePath("/admin/audit");
  revalidatePath("/admin/ops");
  revalidatePath("/admin/launch");
}

export default async function AdminOwnershipPage() {
  const snapshot = await loadAdminOwnershipSnapshot();
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
              Ownership Records
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Durable ownership records created from paid orders and activated
              by fulfillment completion. Named admins can run narrow revoke and
              transfer exception workflows.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Snapshot: {formatDate(snapshot.generatedAt)} -{" "}
              {snapshot.mode === "full"
                ? "Full ownership mode"
                : "Limited ownership mode"}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Actions:{" "}
              {hasNamedAdmin
                ? "Named admin exceptions enabled"
                : "Read-only until Supabase admin login"}
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
          <h2 className="text-xl font-semibold">Recent Ownership Records</h2>
          <div className="mt-4 divide-y divide-slate-200">
            {snapshot.records.length > 0 ? (
              snapshot.records.map((record) => (
                <article className="py-5" key={record.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold">
                        {record.cardTitle}
                      </h3>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {record.artistName} - {record.checkoutReference}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-500">
                        Buyer: {record.buyerLabel}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-500">
                        Recipient: {record.recipientLabel}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <StatusPill value={record.status} />
                      <StatusPill value={record.paymentStatus} />
                      <StatusPill value={record.fulfillmentStatus} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Reveal
                      </p>
                      <p className="mt-1 break-all text-sm text-slate-700">
                        {record.revealPublicId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Item State
                      </p>
                      <p className="mt-1 text-sm capitalize text-slate-700">
                        {record.itemStatus.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Activated
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatDate(record.activatedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Last Updated
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatDate(record.updatedAt)}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Summary
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {record.ownershipSummary}
                      </p>
                      <p className="mt-2 break-words text-xs font-semibold text-slate-500">
                        Metadata: {record.metadataSummary}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-amber-950">
                        Ownership Exception Actions
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-900">
                        These actions write audit and custody evidence. Use transfer
                        only when you have the exact target Supabase profile ID or
                        recipient person ID.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={submitOwnershipException}>
                        <input name="itemId" type="hidden" value={record.orderItemId} />
                        <input
                          name="action"
                          type="hidden"
                          value="revoke_ownership"
                        />
                        <button
                          className="h-9 rounded-md border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-900 shadow-sm hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={
                            !hasNamedAdmin ||
                            !record.orderItemId ||
                            ["refunded", "revoked", "voided"].includes(record.status)
                          }
                          type="submit"
                        >
                          Revoke Ownership
                        </button>
                      </form>
                    </div>
                    <form
                      action={submitOwnershipException}
                      className="grid gap-2 lg:grid-cols-[1fr_1fr_auto]"
                    >
                      <input name="itemId" type="hidden" value={record.orderItemId} />
                      <input
                        name="action"
                        type="hidden"
                        value="transfer_ownership"
                      />
                      <label className="grid gap-1 text-xs font-semibold text-slate-700">
                        Target profile ID
                        <input
                          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950"
                          name="transferToProfileId"
                          placeholder="Supabase profile UUID"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-semibold text-slate-700">
                        Target person ID
                        <input
                          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950"
                          name="transferToPersonId"
                          placeholder="Recipient person UUID"
                        />
                      </label>
                      <button
                        className="h-10 self-end rounded-md border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950 shadow-sm hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={
                          !hasNamedAdmin ||
                          !record.orderItemId ||
                          ["refunded", "revoked", "voided"].includes(record.status)
                        }
                        type="submit"
                      >
                        Transfer
                      </button>
                    </form>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                No ownership records are visible in the current ownership mode.
              </p>
            )}
          </div>
        </section>

        <aside className="min-w-0 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Ownership Health</h2>
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
              Ownership Guardrail
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Ownership exceptions require a named Supabase admin session and
              exact target IDs. Live-money refunds remain separate from this
              page.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
