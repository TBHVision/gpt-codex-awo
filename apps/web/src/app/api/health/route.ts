import { NextResponse } from "next/server";
import { loadLaunchReadinessSnapshot } from "@/lib/launch-readiness";

export const dynamic = "force-dynamic";

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function valueOrNull(name: string) {
  return process.env[name]?.trim() || null;
}

function temporaryPasswordEnabled() {
  return process.env.AWO_DISABLE_TEMP_ADMIN_PASSWORD !== "true";
}

export async function GET() {
  const snapshot = await loadLaunchReadinessSnapshot();
  const temporaryFallbackEnabled = hasEnv("AWO_ADMIN_PASSWORD") && temporaryPasswordEnabled();

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
        adminAuth: {
          namedAdminLoginConfigured:
            hasEnv("NEXT_PUBLIC_SUPABASE_URL") &&
            hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
            hasEnv("SUPABASE_SERVICE_ROLE_KEY") &&
            hasEnv("AWO_ADMIN_SESSION_TOKEN"),
          sessionTokenConfigured: hasEnv("AWO_ADMIN_SESSION_TOKEN"),
          temporaryPasswordDisabled:
            hasEnv("AWO_ADMIN_PASSWORD") && !temporaryPasswordEnabled(),
          temporaryPasswordFallback: temporaryFallbackEnabled,
          temporaryPasswordProductionRisk:
            temporaryFallbackEnabled &&
            (valueOrNull("VERCEL_ENV") ?? "local") === "production",
        },
        observability: {
          analytics:
            hasEnv("NEXT_PUBLIC_POSTHOG_KEY") ||
            hasEnv("POSTHOG_PROJECT_API_KEY") ||
            hasEnv("VERCEL_ANALYTICS_ID"),
          errorTracking: hasEnv("SENTRY_DSN") || hasEnv("NEXT_PUBLIC_SENTRY_DSN"),
          performance:
            hasEnv("NEXT_PUBLIC_VERCEL_SPEED_INSIGHTS_ID") ||
            hasEnv("VERCEL_SPEED_INSIGHTS_ID"),
          uptimeMonitor: hasEnv("AWO_UPTIME_MONITOR_URL"),
        },
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
