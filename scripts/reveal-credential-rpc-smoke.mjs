const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.log(
    "SKIP reveal credential RPC smoke -> Supabase service-role env is not configured.",
  );
  process.exit(0);
}

const response = await fetch(
  `${supabaseUrl}/rest/v1/rpc/generate_order_item_reveal_credential`,
  {
    body: JSON.stringify({
      p_actor_profile_id: null,
      p_note: "RPC guard smoke test; should not generate a credential.",
      p_order_item_id: "00000000-0000-0000-0000-000000000000",
    }),
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  },
);

const payload = await response.json().catch(() => ({}));
const message = String(payload.message ?? payload.error ?? "");

if (response.ok || !message.includes("Named admin actor is required")) {
  throw new Error(
    `Expected named-admin guard from credential RPC, received ${response.status}: ${message}`,
  );
}

console.log("PASS reveal credential RPC exists and enforces named-admin guard");
