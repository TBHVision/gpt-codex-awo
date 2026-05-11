"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  cartUpdatedEventName,
  countCartItems,
  readCartFromStorage,
} from "@/lib/cart-types";

type StorefrontNavProps = {
  active?: "artists" | "cart" | "home" | "people" | "reminders" | "reveal" | "shop";
};

function LineIcon({ kind }: { kind: "cart" | "search" | "user" }) {
  const paths = {
    cart: "M6 6h15l-2 8H8L6 3H3 M9 20h.1 M18 20h.1",
    search: "m21 21-4.4-4.4M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0",
  } as const;

  return (
    <svg aria-hidden="true" className="size-7" viewBox="0 0 24 24">
      <path
        d={paths[kind]}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Logo() {
  return (
    <Link
      className="inline-flex items-center gap-1.5 font-black tracking-tight text-[#8b4f2c]"
      href="/"
    >
      <span className="text-2xl">AW</span>
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,#c98a55_0,#8b4f2c_45%,#5a311b_100%)] text-xs text-[#f8efe4] shadow-[inset_0_0_0_3px_rgba(255,255,255,.2)]">
        O
      </span>
    </Link>
  );
}

const navItems = [
  { href: "/shop", label: "Shop", value: "shop" },
  { href: "/artists", label: "Artists", value: "artists" },
  { href: "/reveal", label: "Reveal", value: "reveal" },
  { href: "/people", label: "People", value: "people" },
  { href: "/reminders", label: "Reminders", value: "reminders" },
] as const;

export default function StorefrontNav({ active }: StorefrontNavProps) {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    function syncCartCount() {
      setItemCount(countCartItems(readCartFromStorage()));
    }

    syncCartCount();
    window.addEventListener(cartUpdatedEventName, syncCartCount);
    window.addEventListener("storage", syncCartCount);

    return () => {
      window.removeEventListener(cartUpdatedEventName, syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, []);

  const utilityActions = (
    <div className="flex shrink-0 items-center gap-4 text-[#252525]">
      <LineIcon kind="search" />
      <LineIcon kind="user" />
      <Link
        aria-label={`Cart with ${itemCount} item${itemCount === 1 ? "" : "s"}`}
        className={`relative inline-flex size-9 items-center justify-center ${
          active === "cart" ? "text-[#a85f38]" : ""
        }`}
        href="/cart"
      >
        <LineIcon kind="cart" />
        <span className="absolute right-0 top-0 inline-flex size-5 items-center justify-center rounded-full bg-[#a85f38] text-xs font-bold text-white">
          {itemCount}
        </span>
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-[#e6e0d9] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          {utilityActions}
        </div>
        <nav className="flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-[#efe8df] pt-3 text-sm font-bold uppercase tracking-wide text-[#2b2927] md:justify-center md:gap-x-12">
          {navItems.map((item) => (
            <Link
              className={`border-b-2 pb-2 ${
                item.value === active
                  ? "border-[#b7653a] text-[#a85f38]"
                  : "border-transparent hover:text-[#a85f38]"
              }`}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
