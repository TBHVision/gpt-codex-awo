import type { CartItem } from "@/lib/cart-types";

export type CheckoutDraftInput = {
  items: CartItem[];
  messageNotes: string;
  occasionLabel: string;
  recipientName: string;
};

export type CheckoutDraftResult = {
  checkoutReference: string;
  itemCount: number;
  orderId: string;
  subtotalCents: number;
  totalCents: number;
};

export type CheckoutDraftResponse =
  | { draft: CheckoutDraftResult; ok: true }
  | { message: string; ok: false };

export function formatCheckoutPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(cents / 100);
}
