import { NextResponse } from "next/server";
import { loadLaunchReadinessSnapshot } from "@/lib/launch-readiness";

export const dynamic = "force-dynamic";

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function valueOrNull(name: string) {
  return process.env[name]?.trim() || null;
}

export async function GET() {
  const snapshot = await loadLaunchReadinessSnapshot();

  return NextResponse.json(
    {
      app: "gpt-codex-awo",
      deployment: {
        branch: valueOrNull("VERCEL_GIT_COMMIT_REF"),
        commit: valueOrNull("VERCEL_GIT_COMMIT_SHA"),
        environment: valueOrNull("VERCEL_ENV") ?? "local",
        provider: hasEnv("VERCEL") ? "vercel" : "local",
        url: valueOrNull("VERCEL_URL"),
      },
      generatedAt: new Date().toISOString(),
      ok: true,
      releaseGate: snapshot.releaseEvidence.status,
      readiness: snapshot.headline,
      services: {
        adminGate:
          hasEnv("AWO_ADMIN_PASSWORD") && hasEnv("AWO_ADMIN_SESSION_TOKEN"),
        stripeTestMode:
          process.env.STRIPE_SECRET_KEY?.trim().startsWith("sk_test_") ?? false,
        stripeWebhook: hasEnv("STRIPE_WEBHOOK_SECRET"),
        supabaseAnon: hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
        supabaseServiceRole: hasEnv("SUPABASE_SERVICE_ROLE_KEY"),
        supabaseUrl: hasEnv("NEXT_PUBLIC_SUPABASE_URL"),
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
