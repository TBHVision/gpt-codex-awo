import { Suspense } from "react";
import CheckoutClient from "@/app/checkout/CheckoutClient";

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutClient />
    </Suspense>
  );
}
