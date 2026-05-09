"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CartItem } from "@/lib/cart-types";

const cartStorageKey = "awo_demo_cart";

function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(cents / 100);
}

function readCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(cartStorageKey);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>(readCart);

  const totalCents = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.priceCents * item.quantity,
        0,
      ),
    [items],
  );

  function clearCart() {
    window.localStorage.removeItem(cartStorageKey);
    setItems([]);
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
            AWO
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Cart</h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={item.slug}
                >
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.artistName} &middot; Qty {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatPrice(item.priceCents * item.quantity, item.currency)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold">Your Cart Is Empty</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add a demo card from the shop to start the checkout shell.
              </p>
              <Link
                className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                href="/shop"
              >
                Browse Cards
              </Link>
            </div>
          )}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Summary</h2>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-sm font-semibold text-slate-600">Total</span>
            <span className="text-lg font-semibold">
              {formatPrice(totalCents)}
            </span>
          </div>
          <Link
            className={`mt-5 inline-flex h-11 w-full items-center justify-center rounded-md px-4 text-sm font-semibold ${
              items.length > 0
                ? "bg-slate-950 text-white hover:bg-slate-800"
                : "pointer-events-none bg-slate-200 text-slate-500"
            }`}
            href="/checkout"
          >
            Checkout Shell
          </Link>
          {items.length > 0 ? (
            <button
              className="mt-3 h-10 w-full rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-slate-400"
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
