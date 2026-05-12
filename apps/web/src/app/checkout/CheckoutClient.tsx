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
import { clearBuyerCart, saveBuyerCart, syncBuyerCart } from "@/lib/buyer-cart";

const demoCartItem: CartItem = {
  artistName: "HatchVision Studio",
  currency: "USD",
  priceCents: 550,
  quantity: 1,
  slug: "wildflower-notes",
  title: "Wildflower Notes",
};

type RuntimePaymentStatus = {
  environment: string;
  isLoaded: boolean;
  provider: string;
  stripeTestMode: boolean;
};

const hostedDemoCheckoutUrl =
  "https://gpt-codex-awo-dashboard.vercel.app/checkout?demo=1";

function cartTotal(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );
}

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const isDemoCheckout = searchParams.get("demo") === "1";
  const [items, setItems] = useState<CartItem[]>([]);
  const [recipientName, setRecipientName] = useState(
    isDemoCheckout ? "Demo Recipient" : "",
  );
  const [occasionLabel, setOccasionLabel] = useState(
    isDemoCheckout ? "Birthday" : "",
  );
  const [messageNotes, setMessageNotes] = useState(
    isDemoCheckout
      ? "I picked this card because it felt calm, handmade, and personal. I hope the artist story behind it makes the moment feel even more yours."
      : "",
  );
  const [draft, setDraft] = useState<CheckoutDraftResult | null>(null);
  const [error, setError] = useState("");
  const [cartStatus, setCartStatus] = useState("");
  const [buyerSession, setBuyerSession] = useState<BuyerSession | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<RuntimePaymentStatus>({
    environment: "unknown",
    isLoaded: false,
    provider: "unknown",
    stripeTestMode: false,
  });

  const itemCount = useMemo(() => countCartItems(items), [items]);
  const totalCents = useMemo(() => cartTotal(items), [items]);
  const paymentState = searchParams.get("payment");
  const orderReference = searchParams.get("order");
  const revealCode = searchParams.get("reveal");
  const paymentSucceeded = paymentState === "success";
  const paymentCancelled = paymentState === "cancelled";
  const canStartStripePayment = paymentStatus.isLoaded && paymentStatus.stripeTestMode;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedItems = readCartFromStorage();
      const localItems =
        isDemoCheckout && storedItems.length === 0 ? [demoCartItem] : storedItems;
      const savedSession = readBuyerSession();

      if (isDemoCheckout && storedItems.length === 0) {
        writeCartToStorage(localItems);
      }

      setItems(localItems);
      setBuyerSession(savedSession);

      if (savedSession) {
        syncBuyerCart(savedSession, localItems)
          .then((mergedItems) => {
            writeCartToStorage(mergedItems);
            setItems(mergedItems);
            setCartStatus("Signed-in cart synced for checkout.");
          })
          .catch(() => {
            setError("Checkout is using the browser cart until account sync works.");
          });
      } else {
        setCartStatus("Guest checkout is using this browser cart.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isDemoCheckout]);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/health", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setPaymentStatus({
          environment: String(payload?.deployment?.environment ?? "unknown"),
          isLoaded: true,
          provider: String(payload?.deployment?.provider ?? "unknown"),
          stripeTestMode: Boolean(payload?.services?.stripeTestMode),
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setPaymentStatus((current) => ({
          ...current,
          isLoaded: true,
          stripeTestMode: false,
        }));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function persistCheckoutItems(nextItems: CartItem[]) {
    const normalizedItems = nextItems.filter((item) => item.quantity > 0);

    setItems(normalizedItems);
    writeCartToStorage(normalizedItems);
    setDraft(null);

    if (!buyerSession) {
      setCartStatus("Checkout cart updated on this browser.");
      return;
    }

    setCartStatus("Saving checkout cart to your account...");
    saveBuyerCart(buyerSession, normalizedItems)
      .then(() => setCartStatus("Checkout cart updated for this account."))
      .catch(() =>
        setCartStatus(
          "Checkout cart updated in this browser. Account cart could not be updated.",
        ),
      );
  }

  function updateQuantity(slug: string, quantity: number) {
    persistCheckoutItems(
      items.map((item) =>
        item.slug === slug
          ? { ...item, quantity: Math.max(1, Math.min(quantity, 25)) }
          : item,
      ),
    );
  }

  function removeItem(slug: string) {
    persistCheckoutItems(items.filter((item) => item.slug !== slug));
  }

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
        const resultMessage = result.ok
          ? "Checkout could not be started yet."
          : result.message;
        setError(
          mode === "payment" &&
            resultMessage.includes("Stripe test checkout is not configured")
            ? "Stripe test checkout is not configured in this running environment. Use Save Draft Only here, or test Stripe on the Vercel deployment after env vars are set."
            : resultMessage,
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
          <p className="mt-3 max-w-2xl text-xs font-bold leading-5 text-[#7a6f66]">
            Local checkout can save drafts even when Stripe secrets are not on
            this PC. Stripe test payment requires the configured Vercel
            environment or local secret variables.
          </p>
          {isDemoCheckout ? (
            <p className="mt-4 inline-flex border border-[#e5ded6] bg-white px-3 py-2 text-xs font-bold text-[#6e6258]">
              Guided demo mode loaded Wildflower Notes and prefilled the
              recipient story.
            </p>
          ) : null}
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
                placeholder={isDemoCheckout ? "Demo Recipient" : "Who is this for?"}
                type="text"
                value={recipientName}
              />
            </label>
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Occasion
              <input
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                onChange={(event) => setOccasionLabel(event.target.value)}
                placeholder={
                  isDemoCheckout ? "Birthday" : "Birthday, support, thank you..."
                }
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
            disabled={isSaving || items.length === 0 || !canStartStripePayment}
            name="checkoutMode"
            type="submit"
            value="payment"
          >
            {isSaving
              ? "Starting Checkout..."
              : canStartStripePayment
                ? "Continue to Test Payment"
                : "Test Payment Unavailable Here"}
          </button>
          {!canStartStripePayment ? (
            <div className="mt-3 border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
              {paymentStatus.isLoaded ? (
                <>
                  Stripe test payment is not configured in this running{" "}
                  {paymentStatus.provider} environment
                  {paymentStatus.environment !== "unknown"
                    ? ` (${paymentStatus.environment})`
                    : ""}
                  . Save a draft here, or use the deployed Vercel demo when
                  you want to exercise Stripe.
                </>
              ) : (
                "Checking whether Stripe test payment is available in this environment..."
              )}
              {paymentStatus.isLoaded && paymentStatus.provider === "local" ? (
                <a
                  className="mt-3 inline-flex h-10 items-center justify-center border border-amber-300 bg-white px-4 text-xs font-black uppercase tracking-wide text-amber-900 hover:border-amber-500"
                  href={hostedDemoCheckoutUrl}
                >
                  Open Hosted Demo Checkout
                </a>
              ) : null}
            </div>
          ) : null}
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
          {cartStatus ? (
            <p className="mt-4 border border-[#e5ded6] bg-[#fbfaf8] p-3 text-xs font-bold leading-5 text-[#6e6258]">
              {cartStatus}
            </p>
          ) : null}
          {items.length > 0 ? (
            <div className="mt-5 space-y-3 border-t border-[#e5ded6] pt-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                Checkout Items
              </p>
              {items.map((item) => (
                <div
                  className="border border-[#e5ded6] bg-[#fbfaf8] p-3"
                  key={item.slug}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">{item.title}</p>
                      <p className="mt-1 text-xs font-bold text-[#6e6258]">
                        {formatCheckoutPrice(item.priceCents * item.quantity, item.currency)}
                      </p>
                    </div>
                    <button
                      className="text-xs font-black uppercase tracking-wide text-[#a21616] hover:text-[#7e1111]"
                      onClick={() => removeItem(item.slug)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      aria-label={`Decrease ${item.title} quantity`}
                      className="inline-flex size-8 items-center justify-center border border-[#dfd5ca] bg-white text-base font-black text-[#7a472e] hover:border-[#b7653a]"
                      onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <input
                      aria-label={`${item.title} quantity`}
                      className="h-8 w-14 border border-[#dfd5ca] bg-white text-center text-xs font-black outline-none focus:border-[#b7653a]"
                      max={25}
                      min={1}
                      onChange={(event) =>
                        updateQuantity(item.slug, Number(event.target.value) || 1)
                      }
                      type="number"
                      value={item.quantity}
                    />
                    <button
                      aria-label={`Increase ${item.title} quantity`}
                      className="inline-flex size-8 items-center justify-center border border-[#dfd5ca] bg-white text-base font-black text-[#7a472e] hover:border-[#b7653a]"
                      onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
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
