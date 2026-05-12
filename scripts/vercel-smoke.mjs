import { execFileSync } from "node:child_process";

process.env.SMOKE_BASE_URL ??= "https://gpt-codex-awo-dashboard.vercel.app";

try {
  process.env.SMOKE_EXPECTED_COMMIT ??= execFileSync("git", [
    "rev-parse",
    "HEAD",
  ], {
    encoding: "utf8",
  }).trim();
} catch {
  console.warn("WARN could not resolve local git HEAD; skipping Vercel commit match.");
}

await import("./smoke-routes.mjs");
