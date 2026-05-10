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

export function readCartFromStorage() {
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
