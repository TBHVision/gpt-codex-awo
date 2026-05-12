import * as Sentry from "@sentry/nextjs";

function sentryDsn() {
  return process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
}

export async function register() {
  if (!sentryDsn()) {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
