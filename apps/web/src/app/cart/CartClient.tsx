"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import StorefrontNav from "@/app/components/StorefrontNav";
import {
  clearCartStorage,
  countCartItems,
  readCartFromStorage,
} from "@/lib/cart-types";
import type { CartItem } from "@/lib/cart-types";

function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(cents / 100);
}

function MiniArtwork({ title }: { title: string }) {
  return (
    <div className="relative size-24 shrink-0 overflow-hidden bg-gradient-to-br from-[#fbf5e9] via-[#f0e0c9] to-[#c98a55] shadow-[0_10px_24px_rgba(45,38,32,.14)]">
      <div className="absolute inset-3 border border-white/50" />
      <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_30%_25%,rgba(255,255,255,.9)_0_2px,transparent_3px),linear-gradient(135deg,transparent_0_47%,rgba(123,77,45,.22)_48%_52%,transparent_53%)] [background-size:24px_24px,100%_100%]" />
      <div className="relative flex h-full items-center justify-center p-3 text-center">
        <span className="text-xs font-black leading-tight text-[#2d2a27]">
          {title}
        </span>
      </div>
    </div>
  );
}

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>([]);

  const itemCount = useMemo(() => countCartItems(items), [items]);

  const totalCents = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.priceCents * item.quantity,
        0,
      ),
    [items],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(readCartFromStorage());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function clearCart() {
    clearCartStorage();
    setItems([]);
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="cart" />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_48%,#f4f0ea_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
            AWO checkout
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Your Cart
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4b4743]">
            Review selected cards before saving a real draft order. Payments
            stay disabled until the checkout lifecycle is approved.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1fr_360px] lg:px-10">
        <div className="border border-[#e5ded6] bg-white p-5 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  className="flex flex-col gap-5 border border-[#e5ded6] bg-[#fbfaf8] p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={item.slug}
                >
                  <div className="flex items-center gap-5">
                    <MiniArtwork title={item.title} />
                    <div>
                      <p className="text-lg font-black">{item.title}</p>
                      <p className="mt-1 text-sm font-semibold text-[#4b4743]">
                        by {item.artistName}
                      </p>
                      <p className="mt-3 text-xs font-black uppercase tracking-wide text-[#8a8178]">
                        Quantity {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-black">
                    {formatPrice(item.priceCents * item.quantity, item.currency)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <h2 className="text-2xl font-black">Your Cart Is Empty</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#4b4743]">
                Add a card from the AWO shop to test the full storefront to
                checkout flow.
              </p>
              <Link
                className="mt-6 inline-flex h-11 items-center justify-center bg-[#252525] px-5 text-sm font-black uppercase tracking-wide text-white hover:bg-[#3a3632]"
                href="/shop"
              >
                Browse Cards
              </Link>
            </div>
          )}
        </div>

        <aside className="h-fit border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
          <h2 className="text-xl font-black">Order Summary</h2>
          <div className="mt-5 space-y-3 border-y border-[#e5ded6] py-5">
            <div className="flex items-center justify-between text-sm font-bold text-[#4b4743]">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-[#4b4743]">
              <span>Payment Status</span>
              <span>Disabled</span>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-wide text-[#4b4743]">
              Total
            </span>
            <span className="text-2xl font-black">{formatPrice(totalCents)}</span>
          </div>
          <Link
            className={`mt-6 inline-flex h-12 w-full items-center justify-center px-4 text-sm font-black uppercase tracking-wide ${
              items.length > 0
                ? "bg-[#252525] text-white hover:bg-[#3a3632]"
                : "pointer-events-none bg-[#e5ded6] text-[#8a8178]"
            }`}
            href="/checkout"
          >
            Continue to Checkout
          </Link>
          {items.length > 0 ? (
            <button
              className="mt-3 h-11 w-full border border-[#dfd5ca] bg-white px-4 text-sm font-black uppercase tracking-wide text-[#b7653a] hover:border-[#b7653a]"
              onClick={clearCart}
              type="button"
            >
              Clear Cart
            </button>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
