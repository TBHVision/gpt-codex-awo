import { NextResponse } from "next/server";
import { verifyBuyerAccessToken } from "@/lib/buyer-session-server";

type BuyerSessionRequestBody = {
  accessToken?: string;
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
      { message: "Buyer session verification is not configured.", ok: false },
      { status: 503 },
    );
  }

  let body: BuyerSessionRequestBody;

  try {
    body = (await request.json()) as BuyerSessionRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Buyer session request could not be read.", ok: false },
      { status: 400 },
    );
  }

  const buyer = await verifyBuyerAccessToken(config, body.accessToken);

  if (!buyer) {
    return NextResponse.json(
      { message: "Buyer session is not valid.", ok: false },
      { status: 401 },
    );
  }

  return NextResponse.json({
    buyer,
    ok: true,
  });
}
