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
            "`npm run test:demo` clicks the stakeholder checkout and seeded reveal handoff.",
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
