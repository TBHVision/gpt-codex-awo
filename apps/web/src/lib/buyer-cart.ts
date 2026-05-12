"use client";

import type { BuyerSession } from "@/lib/buyer-auth";
import type { CartItem } from "@/lib/cart-types";

type ActiveCartRow = {
  id: string;
};

type CartItemRow = {
  card_id: string;
  quantity: number;
  unit_price_cents: number;
};

type PublishedCartCard = {
  artist_name: string;
  currency: string;
  id: string;
  price_cents: number;
  slug: string;
  title: string;
};

function getSupabaseBrowserConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase browser configuration is missing.");
  }

  return { anonKey, supabaseUrl };
}

function authHeaders(session: BuyerSession) {
  const config = getSupabaseBrowserConfig();

  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

function publicHeaders() {
  const config = getSupabaseBrowserConfig();

  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
  };
}

function toCartItem(card: PublishedCartCard, quantity: number): CartItem {
  return {
    artistName: card.artist_name,
    currency: card.currency,
    priceCents: card.price_cents,
    quantity,
    slug: card.slug,
    title: card.title,
  };
}

function mergeCartItems(remoteItems: CartItem[], localItems: CartItem[]) {
  const bySlug = new Map<string, CartItem>();

  for (const item of [...remoteItems, ...localItems]) {
    const existing = bySlug.get(item.slug);
    const quantity = Math.max(1, Math.min(Number(item.quantity) || 1, 25));

    if (!existing) {
      bySlug.set(item.slug, { ...item, quantity });
      continue;
    }

    bySlug.set(item.slug, {
      ...item,
      quantity: Math.max(existing.quantity, quantity),
    });
  }

  return Array.from(bySlug.values());
}

async function fetchPublishedCardsBySlugs(slugs: string[]) {
  if (slugs.length === 0) {
    return [];
  }

  const config = getSupabaseBrowserConfig();
  const endpoint = new URL("/rest/v1/published_cards", config.supabaseUrl);
  endpoint.searchParams.set(
    "select",
    "id,artist_name,title,slug,price_cents,currency",
  );
  endpoint.searchParams.set("slug", `in.(${slugs.join(",")})`);

  const response = await fetch(endpoint, {
    headers: publicHeaders(),
  });

  if (!response.ok) {
    throw new Error("Cart catalog details could not be loaded.");
  }

  return (await response.json()) as PublishedCartCard[];
}

async function fetchPublishedCardsByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  const config = getSupabaseBrowserConfig();
  const endpoint = new URL("/rest/v1/published_cards", config.supabaseUrl);
  endpoint.searchParams.set(
    "select",
    "id,artist_name,title,slug,price_cents,currency",
  );
  endpoint.searchParams.set("id", `in.(${ids.join(",")})`);

  const response = await fetch(endpoint, {
    headers: publicHeaders(),
  });

  if (!response.ok) {
    throw new Error("Saved cart card details could not be loaded.");
  }

  return (await response.json()) as PublishedCartCard[];
}

async function findActiveCart(session: BuyerSession) {
  const config = getSupabaseBrowserConfig();
  const endpoint = new URL("/rest/v1/carts", config.supabaseUrl);
  endpoint.searchParams.set("select", "id");
  endpoint.searchParams.set("owner_profile_id", `eq.${session.user.id}`);
  endpoint.searchParams.set("status", "eq.active");
  endpoint.searchParams.set("order", "updated_at.desc");
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: authHeaders(session),
  });

  if (!response.ok) {
    throw new Error("Saved cart could not be loaded.");
  }

  const carts = (await response.json()) as ActiveCartRow[];
  return carts[0] ?? null;
}

async function createActiveCart(session: BuyerSession) {
  const config = getSupabaseBrowserConfig();
  const endpoint = new URL("/rest/v1/carts", config.supabaseUrl);

  const response = await fetch(endpoint, {
    body: JSON.stringify({
      currency: "USD",
      owner_profile_id: session.user.id,
      status: "active",
    }),
    headers: {
      ...authHeaders(session),
      Prefer: "return=representation",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Saved cart could not be created.");
  }

  const carts = (await response.json()) as ActiveCartRow[];
  return carts[0];
}

async function getOrCreateActiveCart(session: BuyerSession) {
  return (await findActiveCart(session)) ?? (await createActiveCart(session));
}

async function fetchRemoteCartItems(session: BuyerSession, cartId: string) {
  const config = getSupabaseBrowserConfig();
  const endpoint = new URL("/rest/v1/cart_items", config.supabaseUrl);
  endpoint.searchParams.set("select", "card_id,quantity,unit_price_cents");
  endpoint.searchParams.set("cart_id", `eq.${cartId}`);
  endpoint.searchParams.set("order", "created_at.asc");

  const response = await fetch(endpoint, {
    headers: authHeaders(session),
  });

  if (!response.ok) {
    throw new Error("Saved cart items could not be loaded.");
  }

  const rows = (await response.json()) as CartItemRow[];
  const cards = await fetchPublishedCardsByIds(
    Array.from(new Set(rows.map((row) => row.card_id))),
  );
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  return rows
    .map((row) => {
      const card = cardsById.get(row.card_id);
      return card ? toCartItem(card, row.quantity) : null;
    })
    .filter((item): item is CartItem => Boolean(item));
}

async function replaceRemoteCartItems(
  session: BuyerSession,
  cartId: string,
  items: CartItem[],
) {
  const config = getSupabaseBrowserConfig();
  const deleteEndpoint = new URL("/rest/v1/cart_items", config.supabaseUrl);
  deleteEndpoint.searchParams.set("cart_id", `eq.${cartId}`);

  const deleteResponse = await fetch(deleteEndpoint, {
    headers: authHeaders(session),
    method: "DELETE",
  });

  if (!deleteResponse.ok) {
    throw new Error("Saved cart could not be cleared before sync.");
  }

  if (items.length === 0) {
    return [];
  }

  const cards = await fetchPublishedCardsBySlugs(items.map((item) => item.slug));
  const cardsBySlug = new Map(cards.map((card) => [card.slug, card]));
  const insertRows = items
    .map((item) => {
      const card = cardsBySlug.get(item.slug);

      if (!card) {
        return null;
      }

      return {
        card_id: card.id,
        cart_id: cartId,
        quantity: Math.max(1, Math.min(Number(item.quantity) || 1, 25)),
        unit_price_cents: card.price_cents,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (insertRows.length === 0) {
    return [];
  }

  const insertEndpoint = new URL("/rest/v1/cart_items", config.supabaseUrl);
  const insertResponse = await fetch(insertEndpoint, {
    body: JSON.stringify(insertRows),
    headers: {
      ...authHeaders(session),
      Prefer: "return=minimal",
    },
    method: "POST",
  });

  if (!insertResponse.ok) {
    throw new Error("Saved cart items could not be synced.");
  }

  return insertRows;
}

export async function syncBuyerCart(
  session: BuyerSession,
  localItems: CartItem[],
) {
  const cart = await getOrCreateActiveCart(session);
  const remoteItems = await fetchRemoteCartItems(session, cart.id);
  const mergedItems = mergeCartItems(remoteItems, localItems);

  await replaceRemoteCartItems(session, cart.id, mergedItems);

  return mergedItems;
}

export async function saveBuyerCart(
  session: BuyerSession,
  localItems: CartItem[],
) {
  const cart = await getOrCreateActiveCart(session);
  await replaceRemoteCartItems(session, cart.id, localItems);

  return localItems;
}

export async function clearBuyerCart(session: BuyerSession) {
  const cart = await findActiveCart(session);

  if (!cart) {
    return;
  }

  await replaceRemoteCartItems(session, cart.id, []);
}
