"use client";

import { useMemo, useState } from "react";
import {
  agentLanes,
  buildVersions,
  gateReview,
  parkingLot,
} from "@/data/build-dashboard";

const labelStyles: Record<string, string> = {
  Active: "border-l-4 border-emerald-500 bg-emerald-50 text-emerald-900",
  "In Progress": "border-l-4 border-blue-500 bg-blue-50 text-blue-900",
  Planned: "border-l-4 border-slate-300 bg-slate-50 text-slate-700",
  Queued: "border-l-4 border-amber-500 bg-amber-50 text-amber-900",
  Locked: "border-l-4 border-zinc-300 bg-zinc-50 text-zinc-600",
  Blocked: "border-l-4 border-red-500 bg-red-50 text-red-900",
  Complete: "border-l-4 border-green-500 bg-green-50 text-green-900",
  Open: "border-l-4 border-blue-500 bg-blue-50 text-blue-900",
  Approved: "border-l-4 border-green-500 bg-green-50 text-green-900",
  "Pending Review": "border-l-4 border-amber-500 bg-amber-50 text-amber-900",
};

const selfTests = [
  "Production build passes",
  "Lint passes",
  "/admin/build returns HTTP 200",
  "Dashboard shows phases, agents, tests, blockers, and gate status",
  "Docs exist for risks, environments, secrets, tests, and future scope",
];

const humanTests = [
  "Tony can tell what phase we are in",
  "Tony can tell what is blocked or needs attention",
  "Tony confirms the dashboard model is useful enough to guide V0.1",
];

const storageKey = "awo-build-dashboard-v0.0.2";
const currentPhaseId = "V0.0";
const nextPhaseId = "V0.1";

type SavedDashboardState = {
  selfChecked: boolean[];
  humanChecked: boolean[];
  gateChecked: boolean[];
  gateSubmitted: boolean;
  phaseApproved: boolean;
  savedAt: string | null;
};

function getSavedState(): SavedDashboardState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(storageKey);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as SavedDashboardState;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

function normalizeChecks(items: boolean[], length: number) {
  return Array.from({ length }, (_, index) => items[index] ?? false);
}

function StatusLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
      <span className="text-slate-400">State:</span>
      <span
        className={`inline-flex rounded-md border border-slate-200 px-3 py-1.5 ${
        labelStyles[label] ?? "border-l-4 border-slate-300 bg-slate-50 text-slate-700"
      }`}
      >
        {label}
      </span>
    </span>
  );
}

function ActionButton({
  children,
  disabled,
  kind = "primary",
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  kind?: "primary" | "secondary" | "danger";
  onClick?: () => void;
}) {
  const enabledStyles = {
    primary:
      "bg-slate-950 text-white shadow-sm hover:bg-slate-800",
    secondary:
      "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
    danger:
      "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  };

  return (
    <button
      className={
        disabled
          ? "h-10 rounded-md border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-400"
          : `h-10 rounded-md px-4 text-sm font-semibold ${enabledStyles[kind]}`
      }
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ProgressBar({ passed, total }: { passed: number; total: number }) {
  const width = total === 0 ? 0 : Math.round((passed / total) * 100);

  return (
    <div className="min-w-28">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
        <span>
          {passed}/{total}
        </span>
        <span>{width}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-slate-900"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function Checklist({
  items,
  checked,
  title,
  onToggle,
}: {
  items: string[];
  checked: boolean[];
  title: string;
  onToggle: (index: number) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <button
            aria-checked={checked[index]}
            className="flex w-full cursor-pointer gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 hover:bg-white"
            key={item}
            onClick={() => onToggle(index)}
            role="checkbox"
            type="button"
          >
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                checked[index]
                  ? "border-slate-950 bg-slate-950"
                  : "border-slate-300 bg-white"
              }`}
            >
              {checked[index] ? <span className="h-2 w-2 rounded-sm bg-white" /> : null}
            </span>
            <span>{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GateState({ label }: { label: string }) {
  return (
    <span className="text-sm font-semibold text-slate-700">
      Gate state: <span className="text-slate-950">{label}</span>
    </span>
  );
}

function ConfirmGateDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typedPhase, setTypedPhase] = useState("");
  const canConfirm = typedPhase.trim().toUpperCase() === currentPhaseId;

  return (
    <div
      aria-labelledby="gate-confirm-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold" id="gate-confirm-title">
          Approve {currentPhaseId}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Are you sure {currentPhaseId} is complete and ready to move on to{" "}
          {nextPhaseId}? Type {currentPhaseId} to confirm.
        </p>
        <input
          autoFocus
          className="mt-4 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-950"
          onChange={(event) => setTypedPhase(event.target.value)}
          placeholder={currentPhaseId}
          value={typedPhase}
        />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <ActionButton kind="secondary" onClick={onCancel}>
            Cancel
          </ActionButton>
          <ActionButton disabled={!canConfirm} onClick={onConfirm}>
            Approve Phase
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export default function BuildDashboardClient() {
  const [initialSavedState] = useState(() => getSavedState());
  const [selfChecked, setSelfChecked] = useState(() =>
    initialSavedState?.selfChecked?.length === selfTests.length
      ? initialSavedState.selfChecked
      : selfTests.map((item) =>
      [
        "Production build passes",
        "Lint passes",
        "/admin/build returns HTTP 200",
        "Dashboard shows phases, agents, tests, blockers, and gate status",
        "Docs exist for risks, environments, secrets, tests, and future scope",
      ].includes(item),
        ),
  );
  const [humanChecked, setHumanChecked] = useState(() =>
    initialSavedState?.humanChecked?.length === humanTests.length
      ? initialSavedState.humanChecked
      : humanTests.map(() => false),
  );
  const [gateChecked, setGateChecked] = useState(() =>
    initialSavedState?.gateChecked?.length === gateReview.required.length
      ? initialSavedState.gateChecked
      : gateReview.required.map((item) =>
      [
        "Local web app runs",
        "/admin/build dashboard renders",
        "Dashboard shows versions, agents, tests, blockers, and gate status",
        "Docs exist for risks, environments, secrets, tests, and future scope",
      ].includes(item),
        ),
  );
  const [gateSubmitted, setGateSubmitted] = useState(
    initialSavedState?.gateSubmitted ?? false,
  );
  const [phaseApproved, setPhaseApproved] = useState(
    initialSavedState?.phaseApproved ?? false,
  );
  const [showGateConfirm, setShowGateConfirm] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(
    initialSavedState?.savedAt ?? null,
  );

  const currentVersion = buildVersions[0];
  const normalizedSelfChecked = normalizeChecks(selfChecked, selfTests.length);
  const normalizedHumanChecked = normalizeChecks(humanChecked, humanTests.length);
  const normalizedGateChecked = normalizeChecks(
    gateChecked,
    gateReview.required.length,
  );
  const selfPassed = normalizedSelfChecked.filter(Boolean).length;
  const humanPassed = normalizedHumanChecked.filter(Boolean).length;
  const gatePassed = normalizedGateChecked.filter(Boolean).length;
  const canSubmitGate =
    selfPassed === selfTests.length &&
    humanPassed === humanTests.length &&
    gatePassed === gateReview.required.length;

  const liveVersions = useMemo(
    () =>
      buildVersions.map((version, index) =>
        index === 0
          ? {
              ...version,
              status: phaseApproved ? ("Complete" as const) : version.status,
              selfTests: { passed: selfPassed, total: selfTests.length },
              humanTests: { passed: humanPassed, total: humanTests.length },
              gate: phaseApproved
                ? ("Approved" as const)
                : gateSubmitted
                  ? ("Pending Review" as const)
                  : version.gate,
            }
          : index === 1 && phaseApproved
            ? {
                ...version,
                status: "In Progress" as const,
                gate: "Open" as const,
              }
          : version,
      ),
    [gateSubmitted, humanPassed, phaseApproved, selfPassed],
  );

  const toggleSelf = (index: number) => {
    setSelfChecked((items) =>
      normalizeChecks(items, selfTests.length).map((item, itemIndex) =>
        itemIndex === index ? !item : item,
      ),
    );
  };

  const toggleHuman = (index: number) => {
    setHumanChecked((items) =>
      normalizeChecks(items, humanTests.length).map((item, itemIndex) =>
        itemIndex === index ? !item : item,
      ),
    );
  };

  const toggleGate = (index: number) => {
    setGateChecked((items) =>
      normalizeChecks(items, gateReview.required.length).map((item, itemIndex) =>
        itemIndex === index ? !item : item,
      ),
    );
  };

  const saveProgress = (
    submit = gateSubmitted,
    approved = phaseApproved,
  ) => {
    const nextSavedAt = new Date().toLocaleString();
    const state: SavedDashboardState = {
      selfChecked: normalizedSelfChecked,
      humanChecked: normalizedHumanChecked,
      gateChecked: normalizedGateChecked,
      gateSubmitted: submit,
      phaseApproved: approved,
      savedAt: nextSavedAt,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(state));
    setSavedAt(nextSavedAt);
  };

  const submitGateReview = () => {
    setShowGateConfirm(true);
  };

  const approveGateReview = () => {
    setGateSubmitted(true);
    setPhaseApproved(true);
    setShowGateConfirm(false);
    const nextSavedAt = new Date().toLocaleString();
    const state: SavedDashboardState = {
      selfChecked: normalizedSelfChecked,
      humanChecked: normalizedHumanChecked,
      gateChecked: normalizedGateChecked,
      gateSubmitted: true,
      phaseApproved: true,
      savedAt: nextSavedAt,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(state));
    setSavedAt(nextSavedAt);
  };

  const resetReview = () => {
    window.localStorage.removeItem(storageKey);
    setSelfChecked(
      selfTests.map((item) =>
        [
          "Production build passes",
          "Lint passes",
          "/admin/build returns HTTP 200",
          "Dashboard shows phases, agents, tests, blockers, and gate status",
          "Docs exist for risks, environments, secrets, tests, and future scope",
        ].includes(item),
      ),
    );
    setHumanChecked(humanTests.map(() => false));
    setGateChecked(
      gateReview.required.map((item) =>
        [
          "Local web app runs",
          "/admin/build dashboard renders",
          "Dashboard shows versions, agents, tests, blockers, and gate status",
          "Docs exist for risks, environments, secrets, tests, and future scope",
        ].includes(item),
      ),
    );
    setGateSubmitted(false);
    setPhaseApproved(false);
    setShowGateConfirm(false);
    setSavedAt(null);
  };

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      {showGateConfirm ? (
        <ConfirmGateDialog
          onCancel={() => setShowGateConfirm(false)}
          onConfirm={approveGateReview}
        />
      ) : null}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              GPT-Codex AWO
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Build-Version Dashboard
            </h1>
            <a
              className="mt-2 inline-flex text-sm font-semibold text-slate-500 hover:text-slate-950"
              href="/admin/logout"
            >
              Log out
            </a>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:min-w-[420px]">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-950">
                  V0.0 Review
                </div>
                <div className="text-xs text-slate-600">
                  {savedAt
                    ? `Saved ${savedAt}`
                    : phaseApproved
                      ? `${currentPhaseId} approved`
                      : "Not saved yet"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton kind="secondary" onClick={() => saveProgress()}>
                  Save Progress
                </ActionButton>
                <ActionButton kind="danger" onClick={resetReview}>
                  Clear Saved Review
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <Checklist
                checked={normalizedSelfChecked}
                items={selfTests}
                onToggle={toggleSelf}
                title="Codex Tests"
              />
              <Checklist
                checked={normalizedHumanChecked}
                items={humanTests}
                onToggle={toggleHuman}
                title="Human Tests"
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Gate Review</h2>
                  <div className="mt-1">
                    <GateState
                      label={
                        phaseApproved
                          ? "Approved"
                          : gateSubmitted
                            ? "Pending Review"
                            : "Open"
                      }
                    />
                  </div>
                </div>
                <ActionButton
                  disabled={!canSubmitGate || gateSubmitted || phaseApproved}
                  onClick={submitGateReview}
                >
                  Submit Gate Review
                </ActionButton>
              </div>
              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {gateReview.required.map((item, index) => (
                  <button
                    aria-checked={normalizedGateChecked[index]}
                    className="flex cursor-pointer gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 hover:bg-white"
                    key={item}
                    onClick={() => toggleGate(index)}
                    role="checkbox"
                    type="button"
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        normalizedGateChecked[index]
                          ? "border-slate-950 bg-slate-950"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {normalizedGateChecked[index] ? (
                        <span className="h-2 w-2 rounded-sm bg-white" />
                      ) : null}
                    </span>
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Version Phases</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusLabel label={currentVersion.status} />
                <ActionButton
                  disabled={!canSubmitGate || gateSubmitted || phaseApproved}
                  onClick={submitGateReview}
                >
                  Submit Gate Review
                </ActionButton>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.08em] text-slate-500">
                    <th className="py-3 pr-4 font-semibold">Version</th>
                    <th className="py-3 pr-4 font-semibold">Name</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 pr-4 font-semibold">Codex Tests</th>
                    <th className="py-3 pr-4 font-semibold">Human Tests</th>
                    <th className="py-3 pr-4 font-semibold">Gate State</th>
                  </tr>
                </thead>
                <tbody>
                  {liveVersions.map((version) => (
                    <tr
                      className="border-b border-slate-100 align-top last:border-0"
                      key={version.id}
                    >
                      <td className="py-4 pr-4 font-semibold">{version.id}</td>
                      <td className="py-4 pr-4">
                        <div className="font-medium">{version.name}</div>
                        <div className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                          {version.summary}
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <StatusLabel label={version.status} />
                      </td>
                      <td className="py-4 pr-4">
                        <ProgressBar {...version.selfTests} />
                      </td>
                      <td className="py-4 pr-4">
                        <ProgressBar {...version.humanTests} />
                      </td>
                      <td className="py-4 pr-4">
                        <GateState label={version.gate} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-semibold">Agent Lanes</h2>
              <p className="mt-1 text-sm text-slate-600">
                Each lane has an owner, dependencies, and a visible attention
                state.
              </p>
              <div className="mt-5 space-y-3">
                {agentLanes.map((agent) => (
                  <div
                    className="rounded-lg border border-slate-200 p-4"
                    key={agent.name}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{agent.name}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          {agent.owns}
                        </div>
                      </div>
                      <StatusLabel label={agent.status} />
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <div>Depends: {agent.dependsOn}</div>
                      <div>
                        Needs Tony: {agent.needsTony ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Current Deliverables</h2>
            <div className="mt-4 space-y-3">
              {currentVersion.deliverables.map((deliverable) => (
                <div
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                  key={deliverable}
                >
                  {deliverable}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Parking Lot / Future</h2>
            <p className="mt-1 text-sm text-slate-600">
              Good ideas that are deliberately outside the current gate.
            </p>
            <div className="mt-4 space-y-3">
              {parkingLot.map((item) => (
                <div className="rounded-lg border border-slate-200 p-3" key={item.idea}>
                  <div className="font-medium">{item.idea}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {item.reason}
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    Candidate: {item.version}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white">
            <h2 className="text-lg font-semibold">Next Action</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {phaseApproved
                ? `${currentPhaseId} is approved. ${nextPhaseId} is now the active build phase.`
                : `Complete every ${currentPhaseId} Codex Test and Human Test, then submit the gate review before moving to ${nextPhaseId}.`}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
