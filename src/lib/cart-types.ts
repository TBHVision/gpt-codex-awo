export type CartItem = {
  artistName: string;
  currency: string;
  priceCents: number;
  quantity: number;
  slug: string;
  title: string;
};

export const cartStorageKey = "awo_demo_cart";

export const cartUpdatedEventName = "awo-cart-updated";

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CartItem>;

  return (
    typeof candidate.artistName === "string" &&
    typeof candidate.currency === "string" &&
    typeof candidate.priceCents === "number" &&
    Number.isFinite(candidate.priceCents) &&
    typeof candidate.quantity === "number" &&
    Number.isInteger(candidate.quantity) &&
    candidate.quantity > 0 &&
    typeof candidate.slug === "string" &&
    typeof candidate.title === "string"
  );
}

export function readCartFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(cartStorageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(cartStorageKey);
      return [];
    }

    const items = parsed.filter(isCartItem);
    if (items.length !== parsed.length) {
      if (items.length) {
        window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
      } else {
        window.localStorage.removeItem(cartStorageKey);
      }
    }

    return items;
  } catch {
    window.localStorage.removeItem(cartStorageKey);
    return [];
  }
}

export function countCartItems(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function writeCartToStorage(items: CartItem[]) {
  window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  window.dispatchEvent(new Event(cartUpdatedEventName));
}

export function clearCartStorage() {
  window.localStorage.removeItem(cartStorageKey);
  window.dispatchEvent(new Event(cartUpdatedEventName));
}
