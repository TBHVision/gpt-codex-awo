process.env.SMOKE_BASE_URL ??= "https://gpt-codex-awo-dashboard.vercel.app";

await import("./smoke-routes.mjs");
