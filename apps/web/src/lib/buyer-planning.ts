"use client";

import type { BuyerSession } from "@/lib/buyer-auth";

type RestErrorResponse = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

export type SavedPerson = {
  birthday: string | null;
  display_name: string;
  id: string;
  notes: string | null;
  relationship: string | null;
};

export type SavedOccasion = {
  id: string;
  notes: string | null;
  occasion_date: string | null;
  person_id: string | null;
  reminder_days_before: number | null;
  title: string;
};

export type PlanningPerson = {
  id: string;
  name: string;
  occasion: string;
  relationship: string;
  source: "account" | "local";
};

export type PlanningReminder = {
  cadence: string;
  channel: string;
  id: string;
  occasion: string;
  person: string;
  source: "account" | "local";
};

const cadenceToDays: Record<string, number | null> = {
  "30 days before": 30,
  "7 days before": 7,
  "Next shop visit": null,
  "Planning queue": null,
};

function getSupabasePublicConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return { anonKey, supabaseUrl };
}

function restHeaders(session: BuyerSession, preferRepresentation = false) {
  const { anonKey } = getSupabasePublicConfig();

  return {
    apikey: anonKey,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
    ...(preferRepresentation ? { Prefer: "return=representation" } : {}),
  };
}

async function parseRestResponse<T>(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as
    | RestErrorResponse
    | T
    | null;

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      "message" in payload
        ? payload.message
        : null;
    throw new Error(message || fallback);
  }

  return payload as T;
}

function cadenceFromOccasion(occasion: SavedOccasion) {
  if (occasion.reminder_days_before === 30) {
    return "30 days before";
  }

  if (occasion.reminder_days_before === 7) {
    return "7 days before";
  }

  const cadenceMatch = occasion.notes?.match(/Cadence:\s*([^|]+)/i);
  return cadenceMatch?.[1]?.trim() || "Planning queue";
}

export async function fetchPlanningData(session: BuyerSession) {
  const { supabaseUrl } = getSupabasePublicConfig();

  const [peopleResponse, occasionsResponse] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/people?select=id,display_name,relationship,birthday,notes&order=created_at.asc`,
      {
        headers: restHeaders(session),
      },
    ),
    fetch(
      `${supabaseUrl}/rest/v1/occasions?select=id,person_id,title,occasion_date,reminder_days_before,notes&order=created_at.asc`,
      {
        headers: restHeaders(session),
      },
    ),
  ]);

  const [people, occasions] = await Promise.all([
    parseRestResponse<SavedPerson[]>(
      peopleResponse,
      "Could not load saved people.",
    ),
    parseRestResponse<SavedOccasion[]>(
      occasionsResponse,
      "Could not load saved reminders.",
    ),
  ]);

  return { occasions, people };
}

export function combinePeopleAndOccasions(
  people: SavedPerson[],
  occasions: SavedOccasion[],
) {
  const firstOccasionByPerson = new Map<string, SavedOccasion>();

  for (const occasion of occasions) {
    if (occasion.person_id && !firstOccasionByPerson.has(occasion.person_id)) {
      firstOccasionByPerson.set(occasion.person_id, occasion);
    }
  }

  return people.map<PlanningPerson>((person) => ({
    id: person.id,
    name: person.display_name,
    occasion: firstOccasionByPerson.get(person.id)?.title ?? "Planning queue",
    relationship: person.relationship || "Recipient",
    source: "account",
  }));
}

export function combineReminderQueue(
  people: SavedPerson[],
  occasions: SavedOccasion[],
) {
  const peopleById = new Map(people.map((person) => [person.id, person]));

  return occasions.map<PlanningReminder>((occasion) => ({
    cadence: cadenceFromOccasion(occasion),
    channel: "Account storage",
    id: occasion.id,
    occasion: occasion.title,
    person: occasion.person_id
      ? peopleById.get(occasion.person_id)?.display_name ?? "Recipient"
      : "Recipient",
    source: "account",
  }));
}

export async function createPlanningPerson(
  session: BuyerSession,
  input: {
    name: string;
    occasion: string;
    relationship: string;
  },
) {
  const { supabaseUrl } = getSupabasePublicConfig();

  const personResponse = await fetch(`${supabaseUrl}/rest/v1/people`, {
    body: JSON.stringify({
      display_name: input.name,
      owner_profile_id: session.user.id,
      relationship: input.relationship || "Recipient",
    }),
    headers: restHeaders(session, true),
    method: "POST",
  });

  const [person] = await parseRestResponse<SavedPerson[]>(
    personResponse,
    "Could not save the person.",
  );

  const occasionResponse = await fetch(`${supabaseUrl}/rest/v1/occasions`, {
    body: JSON.stringify({
      owner_profile_id: session.user.id,
      person_id: person.id,
      reminder_days_before: 30,
      title: input.occasion,
    }),
    headers: restHeaders(session, true),
    method: "POST",
  });

  const [occasion] = await parseRestResponse<SavedOccasion[]>(
    occasionResponse,
    "Could not save the occasion.",
  );

  return { occasion, person };
}

export async function createPlanningReminder(
  session: BuyerSession,
  input: {
    cadence: string;
    occasion: string;
    person: string;
  },
) {
  const { supabaseUrl } = getSupabasePublicConfig();

  const personResponse = await fetch(`${supabaseUrl}/rest/v1/people`, {
    body: JSON.stringify({
      display_name: input.person,
      owner_profile_id: session.user.id,
      relationship: "Recipient",
    }),
    headers: restHeaders(session, true),
    method: "POST",
  });

  const [person] = await parseRestResponse<SavedPerson[]>(
    personResponse,
    "Could not save the reminder person.",
  );

  const occasionResponse = await fetch(`${supabaseUrl}/rest/v1/occasions`, {
    body: JSON.stringify({
      notes: `Cadence: ${input.cadence}`,
      owner_profile_id: session.user.id,
      person_id: person.id,
      reminder_days_before: cadenceToDays[input.cadence] ?? null,
      title: input.occasion,
    }),
    headers: restHeaders(session, true),
    method: "POST",
  });

  const [occasion] = await parseRestResponse<SavedOccasion[]>(
    occasionResponse,
    "Could not save the reminder.",
  );

  return { occasion, person };
}
