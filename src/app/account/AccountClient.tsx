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

export default function AccountClient() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [password, setPassword] = useState("");
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
      fetchBuyerProfile(savedSession)
        .then(setProfile)
        .catch((loadError: unknown) => {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load the saved buyer profile.",
          );
        });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

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
      setProfile(await fetchBuyerProfile(nextSession));
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
              Buyer-owned tables remain protected by RLS; account-backed People
              and Reminders come next.
            </p>
            <p className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
              Anonymous shopping still works. The cart stays browser-local until
              the next persistence step.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
