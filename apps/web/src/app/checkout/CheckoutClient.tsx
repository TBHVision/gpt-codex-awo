"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import StorefrontNav from "@/app/components/StorefrontNav";
import {
  clearCartStorage,
  countCartItems,
  readCartFromStorage,
  writeCartToStorage,
} from "@/lib/cart-types";
import type { CartItem } from "@/lib/cart-types";
import {
  formatCheckoutPrice,
  type CheckoutDraftResponse,
  type CheckoutDraftResult,
  type CheckoutSessionResponse,
} from "@/lib/checkout-draft";
import { readBuyerSession } from "@/lib/buyer-auth";
import type { BuyerSession } from "@/lib/buyer-auth";
import { clearBuyerCart, syncBuyerCart } from "@/lib/buyer-cart";

function cartTotal(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );
}

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CartItem[]>([]);
  const [recipientName, setRecipientName] = useState("");
  const [occasionLabel, setOccasionLabel] = useState("");
  const [messageNotes, setMessageNotes] = useState("");
  const [draft, setDraft] = useState<CheckoutDraftResult | null>(null);
  const [error, setError] = useState("");
  const [buyerSession, setBuyerSession] = useState<BuyerSession | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const itemCount = useMemo(() => countCartItems(items), [items]);
  const totalCents = useMemo(() => cartTotal(items), [items]);
  const paymentState = searchParams.get("payment");
  const orderReference = searchParams.get("order");
  const revealCode = searchParams.get("reveal");
  const paymentSucceeded = paymentState === "success";
  const paymentCancelled = paymentState === "cancelled";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const localItems = readCartFromStorage();
      const savedSession = readBuyerSession();

      setItems(localItems);
      setBuyerSession(savedSession);

      if (savedSession) {
        syncBuyerCart(savedSession, localItems)
          .then((mergedItems) => {
            writeCartToStorage(mergedItems);
            setItems(mergedItems);
          })
          .catch(() => {
            setError("Checkout is using the browser cart until account sync works.");
          });
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setDraft(null);
    const submitter = event.nativeEvent as SubmitEvent;
    const mode =
      (submitter.submitter as HTMLButtonElement | null)?.value === "payment"
        ? "payment"
        : "draft";

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
      const response = await fetch(
        mode === "payment" ? "/api/checkout/session" : "/api/checkout/draft",
        {
          body: JSON.stringify({
            buyerAccessToken: buyerSession?.access_token,
            items,
            messageNotes,
            occasionLabel,
            recipientName,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      const result = (await response.json()) as
        | CheckoutDraftResponse
        | CheckoutSessionResponse;

      if (!response.ok || !result.ok) {
        setError(
          result.ok
            ? "Checkout could not be started yet."
            : result.message,
        );
        return;
      }

      if ("checkout" in result) {
        window.location.assign(result.checkout.checkoutUrl);
        return;
      }

      if (buyerSession) {
        await clearBuyerCart(buyerSession);
      }
      clearCartStorage();
      setItems([]);
      setDraft(result.draft);
    } catch {
      setError("Checkout could not be started. Please try again.");
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
            Secure checkout
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Checkout
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4b4743]">
            Save recipient, occasion, message, and cart items into AWO. Stripe
            test checkout is available when test-mode keys are configured.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1fr_320px] lg:px-10">
        <form
          className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]"
          onSubmit={submitCheckout}
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
                The order is now saved in Supabase with {draft.itemCount}{" "}
                item{draft.itemCount === 1 ? "" : "s"} totaling{" "}
                {formatCheckoutPrice(draft.totalCents)}. No payment was
                collected.
                {draft.buyerAttached
                  ? " It is attached to your buyer account."
                  : " Sign in before checkout to attach future orders to your account."}
              </p>
            </div>
          ) : null}

          {paymentSucceeded ? (
            <div className="mb-6 border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Test payment complete
              </p>
              <h2 className="mt-2 text-2xl font-black text-emerald-950">
                {orderReference ?? "Order paid"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-emerald-900">
                Stripe returned a successful sandbox payment. AWO has recorded
                the payment and the order is ready for the next fulfillment
                step.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-10 items-center justify-center bg-[#252525] px-4 text-xs font-black uppercase tracking-wide text-white hover:bg-[#3a3632]"
                  href="/account"
                >
                  View Account
                </Link>
                <Link
                  className="inline-flex h-10 items-center justify-center border border-emerald-300 bg-white px-4 text-xs font-black uppercase tracking-wide text-emerald-800 hover:border-emerald-500"
                  href={revealCode ? `/reveal?code=${encodeURIComponent(revealCode)}` : "/reveal"}
                >
                  Preview Reveal
                </Link>
              </div>
            </div>
          ) : null}

          {paymentCancelled ? (
            <div className="mb-6 border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                Test payment cancelled
              </p>
              <h2 className="mt-2 text-2xl font-black text-amber-950">
                {orderReference ?? "Checkout cancelled"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-amber-900">
                Stripe sent you back before payment was completed. You can
                return to the cart and start checkout again.
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
            name="checkoutMode"
            type="submit"
            value="payment"
          >
            {isSaving ? "Starting Checkout..." : "Continue to Test Payment"}
          </button>
          <button
            className="mt-3 h-11 w-full border border-[#dfd5ca] bg-white px-4 text-sm font-black uppercase tracking-wide text-[#7a472e] hover:border-[#b7653a] disabled:cursor-not-allowed disabled:bg-[#f1ece6] disabled:text-[#9d938b]"
            disabled={isSaving || items.length === 0}
            name="checkoutMode"
            type="submit"
            value="draft"
          >
            Save Draft Only
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
              <span>Stripe test mode</span>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#4b4743]">
            Test payment redirects to Stripe when test keys are configured.
            Live charges stay disabled until Tony explicitly approves them.
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
