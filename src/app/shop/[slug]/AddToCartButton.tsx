"use client";

import Link from "next/link";
import { useState } from "react";
import { readCartFromStorage, writeCartToStorage } from "@/lib/cart-types";
import type { CartItem } from "@/lib/cart-types";
import { readBuyerSession } from "@/lib/buyer-auth";
import { syncBuyerCart } from "@/lib/buyer-cart";

export default function AddToCartButton({ item }: { item: CartItem }) {
  const [added, setAdded] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");

  async function addToCart() {
    const cart = readCartFromStorage();
    const existing = cart.find((cartItem) => cartItem.slug === item.slug);
    const nextCart = existing
      ? cart.map((cartItem) =>
          cartItem.slug === item.slug
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        )
      : [...cart, item];

    writeCartToStorage(nextCart);
    setAdded(true);

    const savedSession = readBuyerSession();

    if (!savedSession) {
      setSyncStatus("Saved on this browser.");
      return;
    }

    setSyncStatus("Syncing to your account...");
    try {
      const mergedCart = await syncBuyerCart(savedSession, nextCart);
      writeCartToStorage(mergedCart);
      setSyncStatus("Synced to your account.");
    } catch {
      setSyncStatus("Saved on this browser. Account sync will retry in cart.");
    }
  }

  return (
    <div className="mt-8 space-y-3">
      <button
        className="h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        onClick={addToCart}
        type="button"
      >
        Add to Cart
      </button>
      {added ? (
        <Link
          className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-slate-400"
          href="/cart"
        >
          View Cart
        </Link>
      ) : null}
      {syncStatus ? (
        <p className="text-center text-xs font-bold text-slate-500">
          {syncStatus}
        </p>
      ) : null}
    </div>
  );
}
