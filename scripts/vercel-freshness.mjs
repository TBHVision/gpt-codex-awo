import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const baseUrl =
  process.env.AWO_VERCEL_BASE_URL ?? "https://gpt-codex-awo-dashboard.vercel.app";
const expectedCommit =
  process.env.AWO_EXPECTED_DEPLOY_COMMIT?.trim() || (await currentGitCommit());

async function currentGitCommit() {
  const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"]);
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

const health = await fetchHealth();
const actualCommit = health?.deployment?.commit ?? null;
const provider = health?.deployment?.provider ?? "unknown";
const environment = health?.deployment?.environment ?? "unknown";

if (actualCommit !== expectedCommit) {
  throw new Error(
    [
      "Vercel production is serving a stale build.",
      `expected=${shortCommit(expectedCommit)}`,
      `actual=${shortCommit(actualCommit)}`,
      `baseUrl=${baseUrl}`,
      "Check Vercel deployment status, project root/build settings, and deployment quota before trusting deployed route smoke results.",
    ].join(" "),
  );
}

console.log(
  `PASS Vercel freshness -> ${baseUrl} commit=${shortCommit(actualCommit)} provider=${provider} environment=${environment}`,
);
