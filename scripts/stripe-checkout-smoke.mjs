import { readFileSync } from "node:fs";
import path from "node:path";

function loadLocalEnv() {
  for (const fileName of [".env.local", ".env"]) {
    try {
      const file = readFileSync(path.join(process.cwd(), fileName), "utf8");
      for (const line of file.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
          continue;
        }
        const index = trimmed.indexOf("=");
        const key = trimmed.slice(0, index).trim();
        const rawValue = trimmed.slice(index + 1).trim();
        const value = rawValue.replace(/^['"]|['"]$/g, "");
        if (key && process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    } catch {
      // CI and Vercel verification can inject values directly.
    }
  }
}

loadLocalEnv();

const baseUrl =
  process.env.AWO_STRIPE_SMOKE_BASE_URL ??
  "https://gpt-codex-awo-dashboard.vercel.app";
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let createdOrderId = null;
let createdSessionId = null;

function requireUrl(pathname) {
  try {
    return new URL(pathname, baseUrl);
  } catch {
    throw new Error(`Invalid AWO_STRIPE_SMOKE_BASE_URL: ${baseUrl}`);
  }
}

async function readJson(response, fallback) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`${fallback}: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function expireStripeSession() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!createdSessionId || !secretKey?.startsWith("sk_test_")) {
    console.warn("WARN Stripe checkout session was not expired; local test secret key is unavailable.");
    return;
  }

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${createdSessionId}/expire`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      method: "POST",
    },
  );

  if (!response.ok && response.status !== 400) {
    const payload = await response.text().catch(() => "");
    console.warn(`WARN Stripe checkout session cleanup failed: ${response.status} ${payload}`);
    return;
  }

  console.log(`PASS expired Stripe checkout session ${createdSessionId}`);
}

async function cleanupSupabaseOrder() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!createdOrderId || !supabaseUrl || !serviceRoleKey) {
    console.warn("WARN Supabase smoke order cleanup skipped; service-role config is unavailable.");
    return;
  }

  const endpoint = new URL("/rest/v1/orders", supabaseUrl);
  endpoint.searchParams.set("id", `eq.${createdOrderId}`);

  const response = await fetch(endpoint, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=minimal",
    },
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(`Supabase smoke order cleanup failed: ${response.status} ${payload}`);
  }

  console.log(`PASS cleaned Stripe smoke order ${createdOrderId}`);
}

async function main() {
  const target = requireUrl("/api/checkout/session", baseUrl);
  const response = await fetch(target, {
    body: JSON.stringify({
      items: [
        {
          artistName: "HatchVision Studio",
          currency: "USD",
          priceCents: 550,
          quantity: 1,
          slug: "wildflower-notes",
          title: "Wildflower Notes",
        },
      ],
      messageNotes: `Stripe smoke checkout ${runId}`,
      occasionLabel: "Launch smoke",
      recipientName: `Stripe Smoke ${runId}`,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload = await readJson(response, "Stripe checkout session request failed");

  if (!payload?.ok || !payload.checkout) {
    throw new Error(`Stripe checkout session payload was not ok: ${JSON.stringify(payload)}`);
  }

  const checkout = payload.checkout;
  createdOrderId = checkout.orderId ?? null;
  createdSessionId = checkout.sessionId ?? null;

  if (!checkout.checkoutUrl?.startsWith("https://checkout.stripe.com/")) {
    throw new Error(`Stripe checkout URL was not returned: ${checkout.checkoutUrl ?? "missing"}`);
  }

  if (!checkout.sessionId?.startsWith("cs_test_")) {
    throw new Error(`Stripe checkout session was not test-mode: ${checkout.sessionId ?? "missing"}`);
  }

  if (!checkout.checkoutReference?.startsWith("AWO-DRAFT-")) {
    throw new Error(`Unexpected checkout reference: ${checkout.checkoutReference ?? "missing"}`);
  }

  console.log(`PASS Stripe test checkout session created -> ${target}`);
  console.log(`PASS checkout reference ${checkout.checkoutReference}`);
}

main()
  .finally(async () => {
    await expireStripeSession();
    await cleanupSupabaseOrder();
  })
  .catch((error) => {
    console.error(`FAIL ${error.message}`);
    process.exit(1);
  });
