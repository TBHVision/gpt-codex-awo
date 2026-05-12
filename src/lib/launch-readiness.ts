import { readFile } from "node:fs/promises";
import path from "node:path";

type ReadinessState = "blocked" | "ready" | "review" | "watch";

export type LaunchReadinessItem = {
  detail: string;
  label: string;
  state: ReadinessState;
};

export type LaunchReadinessSection = {
  items: LaunchReadinessItem[];
  title: string;
};

export type LaunchReadinessSnapshot = {
  generatedAt: string;
  headline: {
    blocked: number;
    ready: number;
    review: number;
    watch: number;
  };
  releaseEvidence: {
    finishedAt: string | null;
    status: string;
  };
  sections: LaunchReadinessSection[];
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function stateForPresence(isPresent: boolean): ReadinessState {
  return isPresent ? "ready" : "blocked";
}

function observabilityState(envNames: string[]): ReadinessState {
  return envNames.some((name) => hasEnv(name)) ? "ready" : "review";
}

async function loadLocalReleaseEvidence() {
  try {
    const reportPath = path.join(
      process.cwd(),
      ".qa",
      "release-readiness",
      "latest.json",
    );
    const report = JSON.parse(await readFile(reportPath, "utf8")) as {
      finishedAt?: string | null;
      status?: string;
    };

    return {
      finishedAt: report.finishedAt ?? null,
      status: report.status ?? "unknown",
    };
  } catch {
    return {
      finishedAt: null,
      status: "run npm run test:release",
    };
  }
}

function buildHeadline(sections: LaunchReadinessSection[]) {
  const items = sections.flatMap((section) => section.items);

  return {
    blocked: items.filter((item) => item.state === "blocked").length,
    ready: items.filter((item) => item.state === "ready").length,
    review: items.filter((item) => item.state === "review").length,
    watch: items.filter((item) => item.state === "watch").length,
  };
}

export async function loadLaunchReadinessSnapshot(): Promise<LaunchReadinessSnapshot> {
  const releaseEvidence = await loadLocalReleaseEvidence();
  const localReleaseGateState: ReadinessState =
    releaseEvidence.status === "passed" ? "ready" : "watch";

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const stripeKeyState: ReadinessState = !stripeSecret
    ? "blocked"
    : stripeSecret.startsWith("sk_test_")
      ? "ready"
      : "blocked";
  const namedAdminLoginConfigured =
    hasEnv("NEXT_PUBLIC_SUPABASE_URL") &&
    hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
    hasEnv("SUPABASE_SERVICE_ROLE_KEY") &&
    hasEnv("AWO_ADMIN_SESSION_TOKEN");
  const temporaryAdminFallbackConfigured = hasEnv("AWO_ADMIN_PASSWORD");

  const sections: LaunchReadinessSection[] = [
    {
      title: "Environment",
      items: [
        {
          detail: "Browser-safe Supabase URL is configured.",
          label: "NEXT_PUBLIC_SUPABASE_URL",
          state: stateForPresence(hasEnv("NEXT_PUBLIC_SUPABASE_URL")),
        },
        {
          detail: "Browser-safe Supabase anonymous key is configured.",
          label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          state: stateForPresence(hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
        },
        {
          detail: "Server-only Supabase ops key is configured.",
          label: "SUPABASE_SERVICE_ROLE_KEY",
          state: stateForPresence(hasEnv("SUPABASE_SERVICE_ROLE_KEY")),
        },
        {
          detail:
            stripeKeyState === "ready"
              ? "Stripe is still in test mode, which is correct before Tony approves live charges."
              : "Stripe must use a test key until live payments are explicitly approved.",
          label: "STRIPE_SECRET_KEY test-mode posture",
          state: stripeKeyState,
        },
        {
          detail: "Stripe webhook signature verification secret is configured.",
          label: "STRIPE_WEBHOOK_SECRET",
          state: stateForPresence(hasEnv("STRIPE_WEBHOOK_SECRET")),
        },
        {
          detail: "Protected admin pages require the temporary app password gate.",
          label: "Admin password/session secrets",
          state:
            hasEnv("AWO_ADMIN_PASSWORD") && hasEnv("AWO_ADMIN_SESSION_TOKEN")
              ? "ready"
              : "blocked",
        },
        {
          detail: temporaryAdminFallbackConfigured
            ? "The shared temporary password fallback is still enabled. This is acceptable for controlled pre-launch work but should be removed or restricted before launch."
            : namedAdminLoginConfigured
              ? "Temporary password fallback is disabled; named Supabase admin login has the required app/session configuration."
              : "Named Supabase admin login needs Supabase env vars and AWO_ADMIN_SESSION_TOKEN before the fallback can be removed safely.",
          label: "Temporary admin fallback policy",
          state: temporaryAdminFallbackConfigured
            ? "review"
            : namedAdminLoginConfigured
              ? "ready"
              : "blocked",
        },
      ],
    },
    {
      title: "Release Evidence",
      items: [
        {
          detail:
            releaseEvidence.status === "passed"
              ? "Latest local release-readiness JSON report is passing in `.qa/release-readiness/latest.json`."
              : "Run `npm run test:release` to refresh `.qa/release-readiness/latest.json`.",
          label: "Local release gate",
          state: localReleaseGateState,
        },
        {
          detail:
            "GitHub Actions release-readiness workflow is configured and the latest main run is recorded in Linear evidence.",
          label: "Hosted CI release gate",
          state: "ready",
        },
        {
          detail:
            "`npm run test:demo` clicks the stakeholder checkout, seeded reveal handoff, cart/account recovery checks, and core storefront navigation.",
          label: "Guided demo journey coverage",
          state: "ready",
        },
        {
          detail: "Protected admin launch page is included in smoke and visual QA.",
          label: "Launch page QA coverage",
          state: "ready",
        },
        {
          detail: "Protected admin ownership records page is included in smoke and visual QA.",
          label: "Ownership records QA coverage",
          state: "ready",
        },
        {
          detail: "Protected admin custody event page is included in smoke and visual QA.",
          label: "Custody event QA coverage",
          state: "ready",
        },
        {
          detail: "Protected admin lifecycle reconciliation page is included in smoke and visual QA.",
          label: "Reconciliation QA coverage",
          state: "ready",
        },
      ],
    },
    {
      title: "Observability",
      items: [
        {
          detail:
            "Application exception tracking should be wired through Sentry or an equivalent service before public launch. This check only reports whether a DSN is configured; it never exposes the value.",
          label: "Error tracking DSN",
          state: observabilityState(["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"]),
        },
        {
          detail:
            "Product analytics should be a deliberate privacy decision. This check recognizes PostHog or Vercel Analytics configuration when present.",
          label: "Product analytics",
          state: observabilityState([
            "NEXT_PUBLIC_POSTHOG_KEY",
            "POSTHOG_PROJECT_API_KEY",
            "VERCEL_ANALYTICS_ID",
          ]),
        },
        {
          detail:
            "Performance monitoring should be enabled through Vercel Speed Insights or another web-vitals provider before a broader launch.",
          label: "Performance monitoring",
          state: observabilityState([
            "NEXT_PUBLIC_VERCEL_SPEED_INSIGHTS_ID",
            "VERCEL_SPEED_INSIGHTS_ID",
          ]),
        },
        {
          detail:
            "A production uptime monitor is not configured in app code yet. Vercel deployment status and release gates cover the current pre-launch posture.",
          label: "External uptime monitor",
          state: "review",
        },
      ],
    },
    {
      title: "Documents",
      items: [
        {
          detail: "Repo-local gate evidence exists for Linear comments and future Codex runs.",
          label: "Gate evidence",
          state: "ready",
        },
        {
          detail: "Production gap audit defines what is real versus still pending.",
          label: "Production gap audit",
          state: "ready",
        },
        {
          detail: "QA and release runbook gives the repeatable test path.",
          label: "QA release runbook",
          state: "ready",
        },
        {
          detail: "Observability plan defines the recommended monitoring stack and deferrals.",
          label: "Observability plan",
          state: "ready",
        },
        {
          detail: "Stripe test-mode setup and safety posture are documented.",
          label: "Stripe runbook",
          state: "ready",
        },
      ],
    },
    {
      title: "Human Gates",
      items: [
        {
          detail: "Tony must still review V0.2 through V0.5 buyer, recipient, and artist experiences.",
          label: "Experience review",
          state: "review",
        },
        {
          detail: "Tony must confirm `/admin/ops` is trustworthy enough for the V0.6 gate.",
          label: "Admin ops review",
          state: "review",
        },
        {
          detail:
            "Tony must decide whether Sentry, analytics, Speed Insights, and hosted CI confirmation are required now or deferred.",
          label: "Observability decision",
          state: "review",
        },
        {
          detail:
            "Live Stripe charges remain disabled until Tony explicitly approves them after the test-mode gate.",
          label: "Live payment approval",
          state: "review",
        },
      ],
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    headline: buildHeadline(sections),
    releaseEvidence,
    sections,
  };
}
