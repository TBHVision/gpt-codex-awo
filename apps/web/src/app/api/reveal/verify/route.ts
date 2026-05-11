import { NextResponse } from "next/server";

type RevealRpcRow = {
  artist_bio: string | null;
  artist_name: string | null;
  card_description: string | null;
  card_title: string | null;
  checkout_reference: string | null;
  custody_steps: Array<{ label: string; value: string }>;
  evidence_items: Array<{ label: string; value: string }>;
  message: string;
  ownership_summary: string | null;
  recipient_name: string | null;
  reveal_public_id: string | null;
  reveal_status: string | null;
  success: boolean;
};

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return { anonKey, supabaseUrl };
}

export async function POST(request: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { message: "Supabase public environment variables are not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { cardCode?: string; pin?: string }
    | null;

  const cardCode = body?.cardCode?.trim();
  const pin = body?.pin?.trim();

  if (!cardCode || !pin) {
    return NextResponse.json(
      { message: "Card code and PIN are required." },
      { status: 400 },
    );
  }

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/rpc/verify_honoree_reveal`,
    {
      body: JSON.stringify({
        card_code: cardCode,
        pin,
      }),
      cache: "no-store",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | RevealRpcRow[]
    | { message?: string }
    | null;

  if (!response.ok) {
    return NextResponse.json(
      {
        message:
          payload && !Array.isArray(payload) && payload.message
            ? payload.message
            : "Reveal validation failed.",
      },
      { status: 502 },
    );
  }

  const reveal = Array.isArray(payload) ? payload[0] : null;

  if (!reveal) {
    return NextResponse.json(
      { message: "Reveal validation returned no result." },
      { status: 502 },
    );
  }

  return NextResponse.json(reveal, { status: reveal.success ? 200 : 404 });
}
