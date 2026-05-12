export type LifecycleExceptionAction =
  | "refund_item"
  | "revoke_credential"
  | "revoke_ownership"
  | "transfer_ownership";

type LifecycleExceptionRow = {
  action: string;
  credential_status: string | null;
  item_status: string;
  order_item_id: string;
  ownership_status: string | null;
};

function getConfig() {
  return {
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };
}

function headersFor(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function transitionLifecycleException(input: {
  action: LifecycleExceptionAction;
  adminUserId: string | undefined;
  itemId: string;
  note?: string;
  transferToPersonId?: string;
  transferToProfileId?: string;
}) {
  const { serviceRoleKey, supabaseUrl } = getConfig();

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error("Lifecycle exception actions require Supabase service-role access.");
  }

  if (!input.adminUserId) {
    throw new Error("Named Supabase admin login is required for lifecycle exception actions.");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/admin_transition_lifecycle_exception`,
    {
      body: JSON.stringify({
        p_action: input.action,
        p_actor_profile_id: input.adminUserId,
        p_note: input.note ?? "Transitioned from admin lifecycle tools.",
        p_order_item_id: input.itemId,
        p_transfer_to_person_id: input.transferToPersonId || null,
        p_transfer_to_profile_id: input.transferToProfileId || null,
      }),
      cache: "no-store",
      headers: headersFor(serviceRoleKey),
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Lifecycle exception transition failed.");
  }

  const rows = (await response.json()) as LifecycleExceptionRow[];
  return rows[0] ?? null;
}
