import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getStripeClient,
  getStripeWebhookSecret,
  handleStripeCheckoutEvent,
} from "@/lib/stripe-payments";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();
  const signature = request.headers.get("stripe-signature");

  if (!stripe || !webhookSecret || !signature) {
    return NextResponse.json(
      { message: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json(
      { message: "Stripe webhook signature could not be verified." },
      { status: 400 },
    );
  }

  try {
    await handleStripeCheckoutEvent(event);
  } catch {
    return NextResponse.json(
      { message: "Stripe webhook could not update order lifecycle." },
      { status: 502 },
    );
  }

  return NextResponse.json({ received: true });
}
