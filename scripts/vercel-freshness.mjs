import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const baseUrl =
  process.env.AWO_VERCEL_BASE_URL ?? "https://gpt-codex-awo-dashboard.vercel.app";
const exactExpectedCommit = process.env.AWO_EXPECTED_DEPLOY_COMMIT?.trim() || null;
const expectedCommit = exactExpectedCommit || (await latestAppSourceCommit());

async function latestAppSourceCommit() {
  const deploySourcePaths = [
    "next.config.ts",
    "postcss.config.mjs",
    "public",
    "src",
    "tailwind.config.ts",
    "tsconfig.json",
  ];
  const { stdout } = await execFileAsync("git", [
    "log",
    "-1",
    "--format=%H",
    "--",
    ...deploySourcePaths,
  ]);

  return stdout.trim();
}

async function fetchHealth() {
  const endpoint = new URL("/api/health", baseUrl);
  const response = await fetch(endpoint, { redirect: "manual" });

  if (response.status !== 200) {
    throw new Error(`/api/health expected 200, received ${response.status}`);
  }

  return response.json();
}

function shortCommit(value) {
  return typeof value === "string" && value.length > 0
    ? value.slice(0, 7)
    : "unknown";
}

async function isCommitAtOrAfterExpected(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (actual === expected) {
    return true;
  }

  if (exactExpectedCommit) {
    return false;
  }

  try {
    await execFileAsync("git", ["merge-base", "--is-ancestor", expected, actual]);
    return true;
  } catch {
    return false;
  }
}

const health = await fetchHealth();
const actualCommit = health?.deployment?.commit ?? null;
const provider = health?.deployment?.provider ?? "unknown";
const environment = health?.deployment?.environment ?? "unknown";

if (!(await isCommitAtOrAfterExpected(actualCommit, expectedCommit))) {
  throw new Error(
    [
      "Vercel production is serving a stale build.",
      `expected=${shortCommit(expectedCommit)}`,
      `actual=${shortCommit(actualCommit)}`,
      `baseUrl=${baseUrl}`,
      exactExpectedCommit
        ? "AWO_EXPECTED_DEPLOY_COMMIT requires an exact deployed commit match."
        : "Default expected commit is the latest app-source commit; newer docs/scripts-only deployments are accepted when they contain that app-source commit.",
      "Check Vercel deployment status, project root/build settings, and deployment quota before trusting deployed route smoke results.",
    ].join(" "),
  );
}

console.log(
  `PASS Vercel freshness -> ${baseUrl} commit=${shortCommit(actualCommit)} provider=${provider} environment=${environment}`,
);
