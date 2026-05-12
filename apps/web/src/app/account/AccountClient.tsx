"use client";

import { useEffect, useState } from "react";
import StorefrontNav from "@/app/components/StorefrontNav";
import {
  clearBuyerSession,
  fetchBuyerProfile,
  readBuyerSession,
  saveBuyerSession,
  signInBuyer,
  signUpBuyer,
} from "@/lib/buyer-auth";
import type { BuyerProfile, BuyerSession } from "@/lib/buyer-auth";
import {
  fetchBuyerOrderHistory,
  type BuyerOrderSummary,
} from "@/lib/buyer-orders";
import { formatCheckoutPrice } from "@/lib/checkout-draft";

type Mode = "signin" | "signup";

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label className="text-xs font-black uppercase tracking-wide text-[#6e6258]" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex border border-[#dfd5ca] bg-[#fbfaf8] px-2 py-1 text-[11px] font-black uppercase tracking-wide text-[#6e6258]">
      {children}
    </span>
  );
}

export default function AccountClient() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<BuyerOrderSummary[]>([]);
  const [ordersStatus, setOrdersStatus] = useState("");
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [session, setSession] = useState<BuyerSession | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedSession = readBuyerSession();
      if (!savedSession) {
        return;
      }

      setSession(savedSession);
      setStatus("Loaded saved buyer session from this browser.");
      loadAccount(savedSession)
        .catch((loadError: unknown) => {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load the saved buyer account.",
          );
        });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function loadAccount(nextSession: BuyerSession) {
    setOrdersStatus("Loading order history...");
    const [nextProfile, nextOrders] = await Promise.all([
      fetchBuyerProfile(nextSession),
      fetchBuyerOrderHistory(nextSession),
    ]);
    setProfile(nextProfile);
    setOrders(nextOrders);
    setOrdersStatus(
      nextOrders.length
        ? `Loaded ${nextOrders.length} saved order${nextOrders.length === 1 ? "" : "s"}.`
        : "No saved orders are attached to this buyer account yet.",
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setSubmitting(true);

    try {
      const nextSession =
        mode === "signup"
          ? await signUpBuyer({ displayName, email, password })
          : await signInBuyer({ email, password });

      saveBuyerSession(nextSession);
      setSession(nextSession);
      await loadAccount(nextSession);
      setPassword("");
      setStatus(
        mode === "signup"
          ? "Buyer account created and signed in."
          : "Signed in to the buyer account.",
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The account request failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function signOut() {
    clearBuyerSession();
    setSession(null);
    setProfile(null);
    setOrders([]);
    setOrdersStatus("");
    setStatus("Signed out on this browser.");
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="account" />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_48%,#f4f0ea_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
            Buyer Account
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Sign in to AWO
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4b4743]">
            Browse and cart still work without an account. Signing in starts the
            path for saved people, reminders, and order history.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1fr_360px] lg:px-10">
        <div className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
          {session ? (
            <div>
              <h2 className="text-2xl font-black">Account Connected</h2>
              <div className="mt-5 grid gap-3 text-sm">
                <div className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
                    Email
                  </p>
                  <p className="mt-1 font-bold">{profile?.email ?? session.user.email ?? "Signed in"}</p>
                </div>
                <div className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
                    Role
                  </p>
                  <p className="mt-1 font-bold">{profile?.role ?? "buyer"}</p>
                </div>
                <div className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
                    User ID
                  </p>
                  <p className="mt-1 break-all font-mono text-xs">{session.user.id}</p>
                </div>
              </div>
              <button
                className="mt-6 inline-flex h-11 items-center justify-center border border-[#b7653a] bg-white px-5 text-sm font-black uppercase tracking-wide text-[#7a472e] hover:bg-[#fff8f3]"
                onClick={signOut}
                type="button"
              >
                Sign Out
              </button>

              <div className="mt-8 border-t border-[#e5ded6] pt-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                      Order History
                    </p>
                    <h3 className="mt-1 text-2xl font-black">
                      Saved Orders
                    </h3>
                  </div>
                  <p className="text-xs font-bold text-[#6e6258]">
                    {ordersStatus}
                  </p>
                </div>

                {orders.length ? (
                  <div className="mt-5 grid gap-3">
                    {orders.map((order) => (
                      <div
                        className="border border-[#e5ded6] bg-[#fbfaf8] p-4"
                        key={order.id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-black">
                              {order.checkoutReference}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#5d554e]">
                              {order.recipientName} -{" "}
                              {formatOrderDate(order.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm font-black">
                            {formatCheckoutPrice(
                              order.totalCents,
                              order.currency,
                            )}
                          </p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <StatusBadge>{order.status}</StatusBadge>
                          <StatusBadge>{order.paymentStatus}</StatusBadge>
                          <StatusBadge>{order.fulfillmentStatus}</StatusBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 border border-dashed border-[#dfd5ca] bg-white p-4 text-sm leading-6 text-[#5d554e]">
                    Sign in before checkout, save a draft, and it will appear
                    here for this buyer account.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="inline-flex border border-[#dfd5ca] bg-[#fbfaf8] p-1">
                {(["signin", "signup"] as const).map((nextMode) => (
                  <button
                    className={`h-10 px-5 text-sm font-black uppercase tracking-wide ${
                      mode === nextMode
                        ? "bg-[#252525] text-white"
                        : "text-[#6e6258] hover:text-[#252525]"
                    }`}
                    key={nextMode}
                    onClick={() => setMode(nextMode)}
                    type="button"
                  >
                    {nextMode === "signin" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>

              {mode === "signup" ? (
                <div className="space-y-2">
                  <FieldLabel htmlFor="display-name">Name</FieldLabel>
                  <input
                    className="h-12 w-full border border-[#dfd5ca] bg-white px-4 text-base outline-none focus:border-[#b7653a]"
                    id="display-name"
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Tony"
                    type="text"
                    value={displayName}
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <FieldLabel htmlFor="buyer-email">Email</FieldLabel>
                <input
                  autoComplete="email"
                  className="h-12 w-full border border-[#dfd5ca] bg-white px-4 text-base outline-none focus:border-[#b7653a]"
                  id="buyer-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="buyer-password">Password</FieldLabel>
                <div className="flex border border-[#dfd5ca] bg-white focus-within:border-[#b7653a]">
                  <input
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="h-12 min-w-0 flex-1 px-4 text-base outline-none"
                    id="buyer-password"
                    minLength={6}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    className="h-12 border-l border-[#dfd5ca] px-4 text-xs font-black uppercase tracking-wide text-[#7a472e]"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error ? (
                <p className="border border-[#f0c7c7] bg-[#fff5f5] p-3 text-sm font-bold text-[#9d1c1c]">
                  {error}
                </p>
              ) : null}

              <button
                className="inline-flex h-12 w-full items-center justify-center bg-[#252525] px-6 text-sm font-black uppercase tracking-wide text-white hover:bg-[#3a3632] disabled:bg-[#cfc7bf]"
                disabled={submitting}
                type="submit"
              >
                {submitting
                  ? "Working..."
                  : mode === "signup"
                    ? "Create Buyer Account"
                    : "Sign In"}
              </button>
            </form>
          )}

          {status ? (
            <p className="mt-5 border border-[#cfe8d8] bg-[#f2fbf5] p-3 text-sm font-bold text-[#256b3d]">
              {status}
            </p>
          ) : null}
        </div>

        <aside className="h-fit border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
          <h2 className="text-xl font-black">What This Unlocks</h2>
          <div className="mt-5 space-y-3 text-sm leading-6 text-[#4b4743]">
            <p className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
              Supabase Auth now owns buyer identity instead of the temporary
              admin password gate.
            </p>
            <p className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
              Buyer order history reads through RLS. People, reminders, and
              signed-in carts use the same account-owned pattern.
            </p>
            <p className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
              Anonymous shopping still works. Guest carts stay browser-local;
              signed-in carts sync to Supabase when account storage is
              available.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
