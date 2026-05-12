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
      // CI injects secrets directly when they are configured.
    }
  }
}

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.log(
    "SKIP lifecycle exception RPC smoke -> Supabase service-role env is not configured.",
  );
  process.exit(0);
}

const response = await fetch(
  `${supabaseUrl}/rest/v1/rpc/admin_transition_lifecycle_exception`,
  {
    body: JSON.stringify({
      p_action: "revoke_credential",
      p_actor_profile_id: null,
      p_note: "RPC guard smoke test; should not mutate lifecycle state.",
      p_order_item_id: "00000000-0000-0000-0000-000000000000",
      p_transfer_to_person_id: null,
      p_transfer_to_profile_id: null,
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
    `Expected named-admin guard from lifecycle exception RPC, received ${response.status}: ${message}`,
  );
}

console.log("PASS lifecycle exception RPC exists and enforces named-admin guard");
