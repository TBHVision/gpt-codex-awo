import { execFileSync } from "node:child_process";

process.env.SMOKE_BASE_URL ??= "https://gpt-codex-awo-dashboard.vercel.app";

try {
  process.env.SMOKE_EXPECTED_COMMIT ??= execFileSync("git", [
    "rev-list",
    "-1",
    "HEAD",
    "--",
    "src",
    "apps/web/src",
    "public",
    "apps/web/public",
    "next.config.ts",
    "next.config.mjs",
    "tsconfig.json",
    "postcss.config.mjs",
  ], {
    encoding: "utf8",
  }).trim();
} catch {
  console.warn("WARN could not resolve local git HEAD; skipping Vercel commit match.");
}

await import("./smoke-routes.mjs");
