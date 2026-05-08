export type DashboardStatus =
  | "Active"
  | "In Progress"
  | "Planned"
  | "Queued"
  | "Locked"
  | "Blocked"
  | "Complete";

export type GateState = "Open" | "Locked" | "Pending Review" | "Approved";

export type BuildVersion = {
  id: string;
  name: string;
  status: DashboardStatus;
  gate: GateState;
  summary: string;
  selfTests: { passed: number; total: number };
  humanTests: { passed: number; total: number };
  owners: string[];
  blockers: string[];
  deliverables: string[];
};

export type AgentLane = {
  name: string;
  status: DashboardStatus;
  dependsOn: string;
  owns: string;
  needsTony: boolean;
};

export const gasTank = {
  label: "Green",
  detail:
    "Pro 5x is the right starting tier. Move toward Pro 20x only if long-running parallel agent work repeatedly hits usage limits or slows delivery.",
};

export const buildVersions: BuildVersion[] = [
  {
    id: "V0.0",
    name: "Foundation + Build Dashboard",
    status: "In Progress",
    gate: "Open",
    summary:
      "Create the project cockpit, visible phase plan, agent board, and quality gates before product feature work begins.",
    selfTests: { passed: 0, total: 5 },
    humanTests: { passed: 0, total: 3 },
    owners: ["Orchestrator", "Foundation"],
    blockers: [],
    deliverables: [
      "Next.js app runs locally",
      "/admin/build dashboard renders",
      "Version phases and gates are visible",
      "Agent lanes and dependencies are visible",
      "Project docs exist for risks, tests, secrets, and environments",
    ],
  },
  {
    id: "V0.1",
    name: "Data Model + Auth",
    status: "Planned",
    gate: "Locked",
    summary:
      "Create the Supabase tenant, schema, RLS policies, session model, and admin bootstrap path.",
    selfTests: { passed: 0, total: 8 },
    humanTests: { passed: 0, total: 4 },
    owners: ["Backend", "QA + Hardening"],
    blockers: ["Needs HatchVision-owned Supabase project"],
    deliverables: ["Migrations", "RLS", "Seed data", "Auth sessions", "Admin bootstrap"],
  },
  {
    id: "V0.2",
    name: "Public Shop",
    status: "Planned",
    gate: "Locked",
    summary:
      "Build the buyer storefront, browse filters, card detail pages, cart, and checkout shell.",
    selfTests: { passed: 0, total: 10 },
    humanTests: { passed: 0, total: 5 },
    owners: ["Shop + Buyer"],
    blockers: [],
    deliverables: ["Shop home", "Browse", "Card detail", "Cart", "Checkout shell"],
  },
  {
    id: "V0.3",
    name: "Honoree Reveal",
    status: "Planned",
    gate: "Locked",
    summary:
      "Build the public QR/PIN experience and emotional provenance reveal for recipients.",
    selfTests: { passed: 0, total: 8 },
    humanTests: { passed: 0, total: 5 },
    owners: ["Honoree"],
    blockers: [],
    deliverables: ["QR route", "PIN gate", "Reveal state", "Artist bio", "Provenance data"],
  },
  {
    id: "V0.4",
    name: "My People + Buyer Tools",
    status: "Planned",
    gate: "Locked",
    summary:
      "Build the relationship-centered buyer tools for people, occasions, reminders, and sent-card history.",
    selfTests: { passed: 0, total: 12 },
    humanTests: { passed: 0, total: 6 },
    owners: ["Shop + Buyer"],
    blockers: [],
    deliverables: ["People CRUD", "Occasions", "Calendar", "Find-card links", "Order history"],
  },
  {
    id: "V0.5",
    name: "Artist Studio",
    status: "Planned",
    gate: "Locked",
    summary:
      "Build artist submission, card management, earnings, and inventory gap views.",
    selfTests: { passed: 0, total: 9 },
    humanTests: { passed: 0, total: 5 },
    owners: ["Artist Studio"],
    blockers: [],
    deliverables: ["Dashboard", "Submission form", "Uploads", "Card list", "Earnings"],
  },
  {
    id: "V0.6",
    name: "Admin + Ops",
    status: "Planned",
    gate: "Locked",
    summary:
      "Build the operations dashboard for approvals, users, cards, orders, analytics, and fraud review.",
    selfTests: { passed: 0, total: 14 },
    humanTests: { passed: 0, total: 7 },
    owners: ["Admin + Ops"],
    blockers: [],
    deliverables: ["Approvals", "Users", "Cards", "Orders", "Fraud logs", "Analytics"],
  },
  {
    id: "V0.7",
    name: "QA + Observability",
    status: "Planned",
    gate: "Locked",
    summary:
      "Harden the build with Playwright, Sentry, PostHog, CI, security checks, and release evidence.",
    selfTests: { passed: 0, total: 16 },
    humanTests: { passed: 0, total: 4 },
    owners: ["QA + Hardening", "Production Ops"],
    blockers: [],
    deliverables: ["Playwright", "Sentry", "PostHog", "GitHub Actions", "Snyk"],
  },
  {
    id: "V1.0",
    name: "Launch-Ready Instance",
    status: "Planned",
    gate: "Locked",
    summary:
      "Package the separate GPT-Codex AWO tenant as a production-ready demo instance.",
    selfTests: { passed: 0, total: 20 },
    humanTests: { passed: 0, total: 10 },
    owners: ["Orchestrator", "Production Ops", "QA + Hardening"],
    blockers: [],
    deliverables: ["Production deploy", "Env audit", "Full smoke tests", "Launch review"],
  },
];

export const agentLanes: AgentLane[] = [
  {
    name: "Orchestrator",
    status: "Active",
    dependsOn: "None",
    owns: "Planning, sequencing, gates, integration",
    needsTony: false,
  },
  {
    name: "Foundation",
    status: "Active",
    dependsOn: "None",
    owns: "App scaffold, shared structure, build dashboard",
    needsTony: false,
  },
  {
    name: "Backend",
    status: "Queued",
    dependsOn: "Foundation",
    owns: "Supabase schema, RLS, API/server actions",
    needsTony: false,
  },
  {
    name: "Shop + Buyer",
    status: "Queued",
    dependsOn: "Foundation, Backend",
    owns: "Shop, cart, checkout, My People",
    needsTony: false,
  },
  {
    name: "Honoree",
    status: "Queued",
    dependsOn: "Foundation, Backend",
    owns: "QR/PIN reveal, provenance experience",
    needsTony: false,
  },
  {
    name: "Artist Studio",
    status: "Queued",
    dependsOn: "Foundation, Backend",
    owns: "Artist dashboard, submissions, earnings",
    needsTony: false,
  },
  {
    name: "Admin + Ops",
    status: "Queued",
    dependsOn: "Foundation, Backend",
    owns: "User/card/order ops, approvals, fraud",
    needsTony: false,
  },
  {
    name: "QA + Hardening",
    status: "Queued",
    dependsOn: "Feature lanes",
    owns: "Playwright, accessibility, test evidence",
    needsTony: false,
  },
  {
    name: "Production Ops",
    status: "Queued",
    dependsOn: "Stable build",
    owns: "Vercel, Sentry, PostHog, CI, Snyk",
    needsTony: true,
  },
];

export const gateReview = {
  currentVersion: "V0.0",
  state: "Open",
  required: [
    "Local web app runs",
    "/admin/build dashboard renders",
    "Dashboard shows versions, agents, tests, blockers, and gate status",
    "Docs exist for risks, environments, secrets, tests, and future scope",
    "Tony confirms this is understandable and useful",
  ],
};

export const parkingLot = [
  {
    idea: "Real Stripe charges",
    reason: "Checkout model should stabilize first",
    version: "V1.1",
  },
  {
    idea: "SMS reminders",
    reason: "Requires consent model and Twilio setup",
    version: "V1.1",
  },
  {
    idea: "Browserbase auth tests",
    reason: "Useful after auth flows exist",
    version: "V0.7+",
  },
  {
    idea: "GrowthBook experiments",
    reason: "Useful after traffic exists",
    version: "V1.1+",
  },
  {
    idea: "Public editable build dashboard",
    reason: "Needs auth and admin permissions first",
    version: "V0.6+",
  },
];

