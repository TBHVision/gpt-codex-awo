import { execFile } from "node:child_process";
import { promisify } from "node:util";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const expectedCommit = process.env.SMOKE_EXPECTED_COMMIT?.trim();
const minimumCommit = process.env.SMOKE_MIN_COMMIT?.trim();
const execFileAsync = promisify(execFile);

const publicRoutes = [
  "/",
  "/shop",
  "/search",
  "/demo",
  "/artists",
  "/people",
  "/reminders",
  "/reveal",
  "/studio",
  "/account",
  "/cart",
  "/checkout",
  "/api/health",
];

const protectedRoutes = [
  "/admin/build",
  "/admin/ops",
  "/admin/launch",
  "/admin/reviews",
  "/admin/audit",
  "/admin/fulfillment",
  "/admin/ownership",
  "/admin/custody",
  "/admin/reconciliation",
];

function urlFor(route) {
  return new URL(route, baseUrl).toString();
}

async function checkPublicRoute(route) {
  const response = await fetch(urlFor(route), { redirect: "manual" });

  if (response.status !== 200) {
    throw new Error(`${route} expected 200, received ${response.status}`);
  }

  if (route === "/api/health") {
    const health = await response.json();

    if (health.app !== "gpt-codex-awo" || health.ok !== true) {
      throw new Error("/api/health returned an unexpected payload.");
    }

    if (!health.deployment || typeof health.deployment.provider !== "string") {
      throw new Error("/api/health is missing deployment metadata.");
    }

    if (!health.services || typeof health.services.supabaseUrl !== "boolean") {
      throw new Error("/api/health is missing service posture metadata.");
    }

    if (expectedCommit || minimumCommit) {
      const actualCommit = health.deployment.commit;

      if (expectedCommit && actualCommit !== expectedCommit) {
        throw new Error(
          `/api/health is serving commit ${actualCommit ?? "unknown"}, expected ${expectedCommit}.`,
        );
      }

      if (
        !expectedCommit &&
        minimumCommit &&
        !(await isCommitAtOrAfterMinimum(actualCommit, minimumCommit))
      ) {
        throw new Error(
          `/api/health is serving commit ${actualCommit ?? "unknown"}, expected ${minimumCommit} or newer.`,
        );
      }
    }
  }

  return `${route} -> ${response.status}`;
}

async function checkProtectedRoute(route) {
  const response = await fetch(urlFor(route), { redirect: "manual" });
  const location = response.headers.get("location") ?? "";
  const redirectedToLogin =
    [301, 302, 303, 307, 308].includes(response.status) &&
    location.includes("/admin/login");

  if (!redirectedToLogin) {
    throw new Error(
      `${route} expected admin login redirect, received ${response.status} ${location}`,
    );
  }

  return `${route} -> ${response.status} ${location}`;
}

async function isCommitAtOrAfterMinimum(actual, minimum) {
  if (!actual || !minimum) {
    return false;
  }

  if (actual === minimum) {
    return true;
  }

  try {
    await execFileAsync("git", ["merge-base", "--is-ancestor", minimum, actual]);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`AWO route smoke test: ${baseUrl}`);

  for (const route of publicRoutes) {
    console.log(`PASS ${await checkPublicRoute(route)}`);
  }

  for (const route of protectedRoutes) {
    console.log(`PASS ${await checkProtectedRoute(route)}`);
  }

  console.log("PASS all smoke routes");
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});
