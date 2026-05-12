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
const runId = `lifecycle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `AWO-lifecycle-${runId}!`;

if (!supabaseUrl || !serviceRoleKey) {
  console.log(
    "SKIP lifecycle exception RPC smoke -> Supabase service-role env is not configured.",
  );
  process.exit(0);
}

const cleanup = {
  auditEntityIds: new Set(),
  authUserIds: new Set(),
  cardIds: new Set(),
  orderIds: new Set(),
  orderItemIds: new Set(),
  profileIds: new Set(),
};

function serviceHeaders(extra = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function readJson(response, fallback) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`${fallback}: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function createUser(email, role) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    body: JSON.stringify({
      email,
      email_confirm: true,
      password,
      user_metadata: { display_name: `AWO ${role} lifecycle smoke` },
    }),
    headers: serviceHeaders(),
    method: "POST",
  });
  const payload = await readJson(response, `Unable to create ${role} test user`);
  const user = payload.user ?? payload;
  cleanup.authUserIds.add(user.id);
  cleanup.profileIds.add(user.id);

  await ensureProfile(user, role);

  return user;
}

async function ensureProfile(user, role) {
  const existingResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=id&id=eq.${user.id}&limit=1`,
    { headers: serviceHeaders() },
  );
  const existingRows = await readJson(existingResponse, "Unable to inspect test profile");

  const body = JSON.stringify({
    display_name: user.user_metadata?.display_name ?? null,
    email: user.email,
    id: user.id,
    role,
  });

  if (existingRows.length === 0) {
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      body,
      headers: serviceHeaders({ Prefer: "return=minimal" }),
      method: "POST",
    });
    await readJson(insertResponse, "Unable to create test profile");
    return;
  }

  const patchResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
    body,
    headers: serviceHeaders({ Prefer: "return=minimal" }),
    method: "PATCH",
  });
  await readJson(patchResponse, "Unable to update test profile");
}

async function insertOne(table, body, label) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    body: JSON.stringify(body),
    headers: serviceHeaders({ Prefer: "return=representation" }),
    method: "POST",
  });
  const rows = await readJson(response, `Unable to create ${label}`);
  return rows[0];
}

async function deleteWhere(table, query) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: serviceHeaders({ Prefer: "return=minimal" }),
    method: "DELETE",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Cleanup failed for ${table}?${query}: ${response.status} ${body}`);
  }
}

async function deleteUser(userId) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    headers: serviceHeaders(),
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    const body = await response.text().catch(() => "");
    throw new Error(`Cleanup failed for auth user ${userId}: ${response.status} ${body}`);
  }
}

async function callLifecycleRpc(input) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/admin_transition_lifecycle_exception`,
    {
      body: JSON.stringify({
        p_action: input.action,
        p_actor_profile_id: input.actorProfileId,
        p_note: input.note ?? "Lifecycle exception smoke test.",
        p_order_item_id: input.orderItemId,
        p_transfer_to_person_id: input.transferToPersonId ?? null,
        p_transfer_to_profile_id: input.transferToProfileId ?? null,
      }),
      headers: serviceHeaders(),
      method: "POST",
    },
  );

  return {
    ok: response.ok,
    payload: await response.json().catch(() => null),
    status: response.status,
  };
}

async function assertNamedAdminGuard() {
  const result = await callLifecycleRpc({
    action: "revoke_credential",
    actorProfileId: null,
    note: "RPC guard smoke test; should not mutate lifecycle state.",
    orderItemId: "00000000-0000-0000-0000-000000000000",
  });
  const message = String(result.payload?.message ?? result.payload?.error ?? "");

  if (result.ok || !message.includes("Named admin actor is required")) {
    throw new Error(
      `Expected named-admin guard from lifecycle exception RPC, received ${result.status}: ${message}`,
    );
  }
}

async function createCatalogFixture(artistUser) {
  const artist = await insertOne(
    "artists",
    {
      bio: "Lifecycle smoke artist.",
      profile_id: artistUser.id,
      public_name: `Lifecycle Smoke Artist ${runId}`,
      slug: `lifecycle-smoke-artist-${runId}`,
      status: "approved",
      website_url: "https://example.com/lifecycle-smoke",
    },
    "test artist",
  );

  const card = await insertOne(
    "cards",
    {
      artist_id: artist.id,
      currency: "USD",
      description: "Lifecycle exception smoke card.",
      occasion_tags: ["Originals"],
      price_cents: 550,
      recipient_tags: [],
      slug: `lifecycle-smoke-card-${runId}`,
      status: "published",
      title: `Lifecycle Smoke Card ${runId}`,
    },
    "test card",
  );
  cleanup.cardIds.add(card.id);

  return { artist, card };
}

async function createLifecycleFixture({ artist, buyerUser, card, suffix }) {
  const order = await insertOne(
    "orders",
    {
      buyer_profile_id: buyerUser.id,
      checkout_reference: `AWO-LIFECYCLE-${runId}-${suffix}`,
      currency: "USD",
      fulfillment_status: "fulfilled",
      paid_at: new Date().toISOString(),
      payment_provider: "stripe_test",
      payment_status: "paid",
      status: "paid",
      subtotal_cents: 550,
      tax_cents: 0,
      total_cents: 550,
    },
    `${suffix} test order`,
  );
  cleanup.orderIds.add(order.id);

  const item = await insertOne(
    "order_items",
    {
      artist_id: artist.id,
      card_id: card.id,
      line_total_cents: 550,
      order_id: order.id,
      quantity: 1,
      reveal_public_id: `AWO-LIFE-${runId}-${suffix}`,
      status: "credential_active",
      unit_price_cents: 550,
    },
    `${suffix} test order item`,
  );
  cleanup.orderItemIds.add(item.id);
  cleanup.auditEntityIds.add(item.id);

  await insertOne(
    "honoree_reveals",
    {
      credential_status: "active",
      order_item_id: item.id,
      status: "not_started",
    },
    `${suffix} test reveal`,
  );

  const ownership = await insertOne(
    "ownership_records",
    {
      activated_at: new Date().toISOString(),
      buyer_profile_id: buyerUser.id,
      card_id: card.id,
      metadata: { checkout_reference: order.checkout_reference, source: "lifecycle_smoke" },
      order_item_id: item.id,
      ownership_summary: "Lifecycle smoke active ownership.",
      status: "active",
    },
    `${suffix} test ownership`,
  );

  return { item, order, ownership };
}

async function fetchSingle(table, query, label) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}&limit=1`, {
    headers: serviceHeaders(),
  });
  const rows = await readJson(response, `Unable to fetch ${label}`);
  return rows[0] ?? null;
}

async function fetchCount(table, query, label) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=id&${query}`, {
    headers: serviceHeaders({
      Prefer: "count=exact",
    }),
  });
  await readJson(response, `Unable to count ${label}`);
  return Number(response.headers.get("content-range")?.split("/")?.[1] ?? 0);
}

async function assertRefundWorkflow(fixture, adminUser) {
  const result = await callLifecycleRpc({
    action: "refund_item",
    actorProfileId: adminUser.id,
    note: "Lifecycle smoke refund item.",
    orderItemId: fixture.item.id,
  });

  if (!result.ok || result.payload?.[0]?.item_status !== "refunded") {
    throw new Error(`refund_item did not return refunded item status: ${JSON.stringify(result)}`);
  }

  const [item, order, reveal, ownership] = await Promise.all([
    fetchSingle("order_items", `select=status&id=eq.${fixture.item.id}`, "refunded item"),
    fetchSingle("orders", `select=status,payment_status&id=eq.${fixture.order.id}`, "refunded order"),
    fetchSingle(
      "honoree_reveals",
      `select=credential_status,status&order_item_id=eq.${fixture.item.id}`,
      "refunded reveal",
    ),
    fetchSingle(
      "ownership_records",
      `select=status&order_item_id=eq.${fixture.item.id}`,
      "refunded ownership",
    ),
  ]);

  if (
    item?.status !== "refunded" ||
    order?.status !== "refunded" ||
    order?.payment_status !== "refunded" ||
    reveal?.credential_status !== "revoked" ||
    ownership?.status !== "refunded"
  ) {
    throw new Error("refund_item did not persist expected item/order/reveal/ownership states.");
  }

  const [auditCount, refundedEventCount, credentialEventCount] = await Promise.all([
    fetchCount(
      "admin_audit_events",
      `entity_table=eq.order_items&entity_id=eq.${fixture.item.id}&action=eq.refund_item`,
      "refund audit events",
    ),
    fetchCount(
      "custody_events",
      `order_item_id=eq.${fixture.item.id}&event_type=eq.item_refunded`,
      "item_refunded custody events",
    ),
    fetchCount(
      "custody_events",
      `order_item_id=eq.${fixture.item.id}&event_type=eq.credential_revoked`,
      "refund credential_revoked custody events",
    ),
  ]);

  if (auditCount < 1 || refundedEventCount < 1 || credentialEventCount < 1) {
    throw new Error("refund_item did not write expected audit and custody evidence.");
  }
}

async function assertCredentialRevocationWorkflow(fixture, adminUser) {
  const result = await callLifecycleRpc({
    action: "revoke_credential",
    actorProfileId: adminUser.id,
    note: "Lifecycle smoke credential revocation.",
    orderItemId: fixture.item.id,
  });

  if (!result.ok || result.payload?.[0]?.credential_status !== "revoked") {
    throw new Error(`revoke_credential did not return revoked credential status: ${JSON.stringify(result)}`);
  }

  const [reveal, eventCount, auditCount] = await Promise.all([
    fetchSingle(
      "honoree_reveals",
      `select=credential_status,status&order_item_id=eq.${fixture.item.id}`,
      "revoked credential",
    ),
    fetchCount(
      "custody_events",
      `order_item_id=eq.${fixture.item.id}&event_type=eq.credential_revoked`,
      "credential revoke custody events",
    ),
    fetchCount(
      "admin_audit_events",
      `entity_table=eq.order_items&entity_id=eq.${fixture.item.id}&action=eq.revoke_credential`,
      "credential revoke audit events",
    ),
  ]);

  if (reveal?.credential_status !== "revoked" || eventCount < 1 || auditCount < 1) {
    throw new Error("revoke_credential did not persist expected reveal/audit/custody evidence.");
  }
}

async function assertOwnershipRevocationWorkflow(fixture, adminUser) {
  const result = await callLifecycleRpc({
    action: "revoke_ownership",
    actorProfileId: adminUser.id,
    note: "Lifecycle smoke ownership revocation.",
    orderItemId: fixture.item.id,
  });

  if (!result.ok || result.payload?.[0]?.ownership_status !== "revoked") {
    throw new Error(`revoke_ownership did not return revoked ownership status: ${JSON.stringify(result)}`);
  }

  const [ownership, eventCount, auditCount] = await Promise.all([
    fetchSingle(
      "ownership_records",
      `select=status&order_item_id=eq.${fixture.item.id}`,
      "revoked ownership",
    ),
    fetchCount(
      "custody_events",
      `order_item_id=eq.${fixture.item.id}&event_type=eq.ownership_revoked`,
      "ownership revoke custody events",
    ),
    fetchCount(
      "admin_audit_events",
      `entity_table=eq.order_items&entity_id=eq.${fixture.item.id}&action=eq.revoke_ownership`,
      "ownership revoke audit events",
    ),
  ]);

  if (ownership?.status !== "revoked" || eventCount < 1 || auditCount < 1) {
    throw new Error("revoke_ownership did not persist expected ownership/audit/custody evidence.");
  }
}

async function assertOwnershipTransferWorkflow(fixture, adminUser, targetUser) {
  const result = await callLifecycleRpc({
    action: "transfer_ownership",
    actorProfileId: adminUser.id,
    note: "Lifecycle smoke ownership transfer.",
    orderItemId: fixture.item.id,
    transferToProfileId: targetUser.id,
  });

  if (!result.ok || result.payload?.[0]?.ownership_status !== "transferred") {
    throw new Error(`transfer_ownership did not return transferred ownership status: ${JSON.stringify(result)}`);
  }

  const [ownership, eventCount, auditCount] = await Promise.all([
    fetchSingle(
      "ownership_records",
      `select=status,buyer_profile_id&order_item_id=eq.${fixture.item.id}`,
      "transferred ownership",
    ),
    fetchCount(
      "custody_events",
      `order_item_id=eq.${fixture.item.id}&event_type=eq.ownership_transferred`,
      "ownership transfer custody events",
    ),
    fetchCount(
      "admin_audit_events",
      `entity_table=eq.order_items&entity_id=eq.${fixture.item.id}&action=eq.transfer_ownership`,
      "ownership transfer audit events",
    ),
  ]);

  if (
    ownership?.status !== "transferred" ||
    ownership?.buyer_profile_id !== targetUser.id ||
    eventCount < 1 ||
    auditCount < 1
  ) {
    throw new Error("transfer_ownership did not persist expected ownership/audit/custody evidence.");
  }
}

async function cleanupFixtures() {
  const errors = [];
  const tryCleanup = async (task) => {
    try {
      await task();
    } catch (error) {
      errors.push(error);
    }
  };

  for (const itemId of cleanup.auditEntityIds) {
    await tryCleanup(() =>
      deleteWhere("admin_audit_events", `entity_table=eq.order_items&entity_id=eq.${itemId}`),
    );
  }
  for (const itemId of cleanup.orderItemIds) {
    await tryCleanup(() => deleteWhere("custody_events", `order_item_id=eq.${itemId}`));
    await tryCleanup(() => deleteWhere("ownership_records", `order_item_id=eq.${itemId}`));
    await tryCleanup(() => deleteWhere("honoree_reveals", `order_item_id=eq.${itemId}`));
  }
  for (const orderId of cleanup.orderIds) {
    await tryCleanup(() => deleteWhere("order_items", `order_id=eq.${orderId}`));
    await tryCleanup(() => deleteWhere("orders", `id=eq.${orderId}`));
  }
  for (const cardId of cleanup.cardIds) {
    await tryCleanup(() => deleteWhere("cards", `id=eq.${cardId}`));
  }
  for (const profileId of cleanup.profileIds) {
    await tryCleanup(() => deleteWhere("artists", `profile_id=eq.${profileId}`));
  }
  for (const userId of cleanup.authUserIds) {
    await tryCleanup(() => deleteUser(userId));
  }

  if (errors.length > 0) {
    throw new Error(
      `Lifecycle smoke cleanup had ${errors.length} error(s): ${errors
        .map((error) => error.message)
        .join(" | ")}`,
    );
  }
}

async function main() {
  let cleanupError;

  try {
    await assertNamedAdminGuard();

    const [adminUser, artistUser, buyerUser, targetBuyerUser] = await Promise.all([
      createUser(`awo-lifecycle-admin-${runId}@example.test`, "admin"),
      createUser(`awo-lifecycle-artist-${runId}@example.test`, "artist"),
      createUser(`awo-lifecycle-buyer-${runId}@example.test`, "buyer"),
      createUser(`awo-lifecycle-target-${runId}@example.test`, "buyer"),
    ]);

    const catalog = await createCatalogFixture(artistUser);
    const refundFixture = await createLifecycleFixture({
      ...catalog,
      buyerUser,
      suffix: "refund",
    });
    const credentialFixture = await createLifecycleFixture({
      ...catalog,
      buyerUser,
      suffix: "credential",
    });
    const revokeOwnershipFixture = await createLifecycleFixture({
      ...catalog,
      buyerUser,
      suffix: "revoke-owner",
    });
    const transferOwnershipFixture = await createLifecycleFixture({
      ...catalog,
      buyerUser,
      suffix: "transfer-owner",
    });

    await assertRefundWorkflow(refundFixture, adminUser);
    await assertCredentialRevocationWorkflow(credentialFixture, adminUser);
    await assertOwnershipRevocationWorkflow(revokeOwnershipFixture, adminUser);
    await assertOwnershipTransferWorkflow(
      transferOwnershipFixture,
      adminUser,
      targetBuyerUser,
    );

    console.log(
      "PASS lifecycle exception RPC guard and refund/revoke/transfer transitions",
    );
  } finally {
    try {
      await cleanupFixtures();
    } catch (error) {
      cleanupError = error;
    }
  }

  if (cleanupError) {
    throw cleanupError;
  }
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
