import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enabled:
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_SENTRY_ENABLE_LOCAL === "true",
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.05,
    ),
  });
}
