const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

const publicRoutes = [
  "/",
  "/shop",
  "/artists",
  "/people",
  "/reminders",
  "/reveal",
  "/studio",
  "/account",
  "/cart",
  "/checkout",
];

const protectedRoutes = ["/admin/build", "/admin/ops", "/admin/launch", "/admin/reviews"];

function urlFor(route) {
  return new URL(route, baseUrl).toString();
}

async function checkPublicRoute(route) {
  const response = await fetch(urlFor(route), { redirect: "manual" });

  if (response.status !== 200) {
    throw new Error(`${route} expected 200, received ${response.status}`);
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
