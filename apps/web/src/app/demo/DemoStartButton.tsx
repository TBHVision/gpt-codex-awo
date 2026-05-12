"use client";

import {
  writeCartToStorage,
  type CartItem,
} from "@/lib/cart-types";

const demoCartItem: CartItem = {
  artistName: "HatchVision Studio",
  currency: "USD",
  priceCents: 550,
  quantity: 1,
  slug: "wildflower-notes",
  title: "Wildflower Notes",
};

export default function DemoStartButton() {
  function startDemo() {
    writeCartToStorage([demoCartItem]);
    window.location.assign("/checkout?demo=1");
  }

  return (
    <button
      className="inline-flex h-12 items-center justify-center bg-[#252525] px-6 text-sm font-black uppercase tracking-wide text-white hover:bg-[#3a3632]"
      onClick={startDemo}
      type="button"
    >
      Start Guided Checkout
    </button>
  );
}
