"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import StorefrontNav from "@/app/components/StorefrontNav";
import {
  clearCartStorage,
  countCartItems,
  readCartFromStorage,
} from "@/lib/cart-types";
import type { CartItem } from "@/lib/cart-types";
import {
  formatCheckoutPrice,
  type CheckoutDraftResponse,
  type CheckoutDraftResult,
} from "@/lib/checkout-draft";

function cartTotal(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );
}

export default function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [recipientName, setRecipientName] = useState("");
  const [occasionLabel, setOccasionLabel] = useState("");
  const [messageNotes, setMessageNotes] = useState("");
  const [draft, setDraft] = useState<CheckoutDraftResult | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const itemCount = useMemo(() => countCartItems(items), [items]);
  const totalCents = useMemo(() => cartTotal(items), [items]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(readCartFromStorage());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setDraft(null);

    if (items.length === 0) {
      setError("Add at least one card before saving a checkout draft.");
      return;
    }

    if (!recipientName.trim()) {
      setError("Recipient name is required.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/checkout/draft", {
        body: JSON.stringify({
          items,
          messageNotes,
          occasionLabel,
          recipientName,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as CheckoutDraftResponse;

      if (!response.ok || !result.ok) {
        setError(
          result.ok
            ? "Checkout draft could not be saved yet."
            : result.message,
        );
        return;
      }

      clearCartStorage();
      setItems([]);
      setDraft(result.draft);
    } catch {
      setError("Checkout draft could not be saved. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="cart" />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_48%,#f4f0ea_100%)]">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
            Draft order
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Checkout Draft
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4b4743]">
            Save recipient, occasion, message, and cart items into the AWO
            backend. Payment is still disabled; this creates a durable draft
            order for the next workflow.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1fr_320px] lg:px-10">
        <form
          className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]"
          onSubmit={submitDraft}
        >
          {draft ? (
            <div className="mb-6 border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Draft saved
              </p>
              <h2 className="mt-2 text-2xl font-black text-emerald-950">
                {draft.checkoutReference}
              </h2>
              <p className="mt-3 text-sm leading-6 text-emerald-900">
                The order draft is now saved in Supabase with {draft.itemCount}{" "}
                item{draft.itemCount === 1 ? "" : "s"} totaling{" "}
                {formatCheckoutPrice(draft.totalCents)}. No payment was
                collected.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {error}
            </div>
          ) : null}

          <div className="grid gap-5">
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Recipient Name
              <input
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                onChange={(event) => setRecipientName(event.target.value)}
                placeholder="Who is this for?"
                type="text"
                value={recipientName}
              />
            </label>
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Occasion
              <input
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                onChange={(event) => setOccasionLabel(event.target.value)}
                placeholder="Birthday, support, thank you..."
                type="text"
                value={occasionLabel}
              />
            </label>
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Message Notes
              <textarea
                className="mt-2 min-h-32 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 py-2 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                onChange={(event) => setMessageNotes(event.target.value)}
                placeholder="Draft a note or leave guidance for the final experience."
                value={messageNotes}
              />
            </label>
          </div>

          <button
            className="mt-6 h-12 w-full bg-[#252525] px-4 text-sm font-black uppercase tracking-wide text-white hover:bg-[#3a3632] disabled:cursor-not-allowed disabled:bg-[#d8d0c7] disabled:text-[#7d746d]"
            disabled={isSaving || items.length === 0}
            type="submit"
          >
            {isSaving ? "Saving Draft..." : "Save Checkout Draft"}
          </button>
        </form>

        <aside className="h-fit border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
          <h2 className="text-xl font-black">Draft Summary</h2>
          <div className="mt-5 space-y-3 border-y border-[#e5ded6] py-5">
            <div className="flex items-center justify-between text-sm font-bold text-[#4b4743]">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-[#4b4743]">
              <span>Total</span>
              <span>{formatCheckoutPrice(totalCents)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-[#4b4743]">
              <span>Payment</span>
              <span>Not collected</span>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#4b4743]">
            This step creates a database-backed draft only. Stripe and live
            fulfillment stay disabled until the lifecycle model is approved.
          </p>
          <Link
            className="mt-6 inline-flex h-11 w-full items-center justify-center border border-[#dfd5ca] bg-white px-4 text-sm font-black uppercase tracking-wide text-[#b7653a] hover:border-[#b7653a]"
            href="/cart"
          >
            Back to Cart
          </Link>
          {draft ? (
            <Link
              className="mt-3 inline-flex h-11 w-full items-center justify-center bg-[#252525] px-4 text-sm font-black uppercase tracking-wide text-white hover:bg-[#3a3632]"
              href="/reveal"
            >
              Preview Reveal Flow
            </Link>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
