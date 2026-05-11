import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe-payments";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Checkout request could not be read.", ok: false },
      { status: 400 },
    );
  }

  try {
    const result = await createCheckoutSession(
      body as Parameters<typeof createCheckoutSession>[0],
      new URL(request.url).origin,
    );

    return NextResponse.json({
      checkout: result,
      ok: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Stripe test checkout could not be started.";
    const status = message.includes("not configured") ? 503 : 400;

    return NextResponse.json({ message, ok: false }, { status });
  }
}
