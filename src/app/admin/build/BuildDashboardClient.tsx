"use client";

import { useEffect, useMemo, useState } from "react";
import {
  agentLanes,
  buildVersions,
  gasTank,
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

const storageKey = "awo-build-dashboard-v0";

type SavedDashboardState = {
  selfChecked: boolean[];
  humanChecked: boolean[];
  gateChecked: boolean[];
  gateSubmitted: boolean;
  savedAt: string | null;
};

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
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <label
            className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
            key={item}
          >
            <input
              checked={checked[index]}
              className="mt-0.5 h-4 w-4 accent-slate-950"
              onChange={() => onToggle(index)}
              type="checkbox"
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function BuildDashboardClient() {
  const [selfChecked, setSelfChecked] = useState(() =>
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
  const [humanChecked, setHumanChecked] = useState(() =>
    humanTests.map(() => false),
  );
  const [gateChecked, setGateChecked] = useState(() =>
    gateReview.required.map((item) =>
      [
        "Local web app runs",
        "/admin/build dashboard renders",
        "Dashboard shows versions, agents, tests, blockers, and gate status",
        "Docs exist for risks, environments, secrets, tests, and future scope",
      ].includes(item),
    ),
  );
  const [gateSubmitted, setGateSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const currentVersion = buildVersions[0];
  const selfPassed = selfChecked.filter(Boolean).length;
  const humanPassed = humanChecked.filter(Boolean).length;
  const gatePassed = gateChecked.filter(Boolean).length;
  const canSubmitGate =
    selfPassed === selfTests.length &&
    humanPassed === humanTests.length &&
    gatePassed === gateReview.required.length;

  useEffect(() => {
    window.setTimeout(() => {
      const stored = window.localStorage.getItem(storageKey);

      if (stored) {
        try {
          const parsed = JSON.parse(stored) as SavedDashboardState;

          if (parsed.selfChecked?.length === selfTests.length) {
            setSelfChecked(parsed.selfChecked);
          }

          if (parsed.humanChecked?.length === humanTests.length) {
            setHumanChecked(parsed.humanChecked);
          }

          if (parsed.gateChecked?.length === gateReview.required.length) {
            setGateChecked(parsed.gateChecked);
          }

          setGateSubmitted(Boolean(parsed.gateSubmitted));
          setSavedAt(parsed.savedAt ?? null);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }

      setLoaded(true);
    }, 0);
  }, []);

  const liveVersions = useMemo(
    () =>
      buildVersions.map((version, index) =>
        index === 0
          ? {
              ...version,
              selfTests: { passed: selfPassed, total: selfTests.length },
              humanTests: { passed: humanPassed, total: humanTests.length },
              gate: gateSubmitted ? ("Pending Review" as const) : version.gate,
            }
          : version,
      ),
    [gateSubmitted, humanPassed, selfPassed],
  );

  const toggleSelf = (index: number) => {
    setSelfChecked((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? !item : item)),
    );
  };

  const toggleHuman = (index: number) => {
    setHumanChecked((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? !item : item)),
    );
  };

  const toggleGate = (index: number) => {
    setGateChecked((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? !item : item)),
    );
  };

  const saveProgress = (submit = gateSubmitted) => {
    const nextSavedAt = new Date().toLocaleString();
    const state: SavedDashboardState = {
      selfChecked,
      humanChecked,
      gateChecked,
      gateSubmitted: submit,
      savedAt: nextSavedAt,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(state));
    setSavedAt(nextSavedAt);
  };

  const submitGateReview = () => {
    setGateSubmitted(true);
    const nextSavedAt = new Date().toLocaleString();
    const state: SavedDashboardState = {
      selfChecked,
      humanChecked,
      gateChecked,
      gateSubmitted: true,
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
    setSavedAt(null);
  };

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              GPT-Codex AWO
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Build-Version Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              The control tower for phases, agent lanes, test coverage, gate
              reviews, blockers, and Tony review points.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm font-medium text-emerald-900">
                Gas Tank
              </div>
              <div className="mt-1 text-2xl font-semibold text-emerald-950">
                {gasTank.label}
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-medium text-blue-900">
                Current Gate
              </div>
              <div className="mt-1 text-2xl font-semibold text-blue-950">
                {gateReview.currentVersion}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Version Phases</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Labels show state. Filled rectangular buttons are actions.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusLabel label={currentVersion.status} />
                <ActionButton
                  disabled={!canSubmitGate || gateSubmitted}
                  onClick={submitGateReview}
                >
                  Submit Gate Review
                </ActionButton>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Review Progress
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {savedAt
                    ? `Saved in this browser at ${savedAt}.`
                    : loaded
                      ? "Not saved yet. Save progress before leaving this browser."
                      : "Loading saved review state..."}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton kind="secondary" onClick={() => saveProgress()}>
                  Save Progress
                </ActionButton>
                <ActionButton kind="danger" onClick={resetReview}>
                  Reset Review
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
                    <th className="py-3 pr-4 font-semibold">Self Tests</th>
                    <th className="py-3 pr-4 font-semibold">Human Tests</th>
                    <th className="py-3 pr-4 font-semibold">Gate</th>
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
                        <div className="space-y-2">
                          <StatusLabel label={version.gate} />
                          {version.id === "V0.0" ? (
                            <div className="text-xs text-slate-500">
                              Use the review panel below.
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Checklist
              checked={selfChecked}
              items={selfTests}
              onToggle={toggleSelf}
              title="V0.0 Self Tests"
            />
            <Checklist
              checked={humanChecked}
              items={humanTests}
              onToggle={toggleHuman}
              title="V0.0 Human Tests"
            />
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

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-semibold">Current Gate Review</h2>
              <p className="mt-1 text-sm text-slate-600">
                V0.0 closes only when evidence and human review line up.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <StatusLabel label={gateSubmitted ? "Pending Review" : "Open"} />
                <span className="text-sm text-slate-500">
                  {gateReview.currentVersion}
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {gateReview.required.map((item, index) => (
                  <label
                    className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                    key={item}
                  >
                    <input
                      checked={gateChecked[index]}
                      className="mt-0.5 h-4 w-4 accent-slate-950"
                      onChange={() => toggleGate(index)}
                      type="checkbox"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  Gate Rule
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  The gate review can be submitted only after every self test,
                  human test, and gate requirement is checked. The result saves
                  locally in this browser for V0.0.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton
                    disabled={!canSubmitGate || gateSubmitted}
                    onClick={submitGateReview}
                  >
                    Submit Gate Review
                  </ActionButton>
                  <ActionButton kind="secondary" onClick={() => saveProgress()}>
                    Save Progress
                  </ActionButton>
                </div>
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
              Complete every V0.0 self test and human test, then submit the
              gate review before moving to V0.1.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
