const linearProjectUrl =
  "https://linear.app/hatchvision/project/gpt-codex-awo-build-7e22f4e31cd8";

const activeIssues = [
  {
    id: "AWO-5",
    title: "Design initial Supabase schema and migrations",
    url: "https://linear.app/hatchvision/issue/AWO-5/design-initial-supabase-schema-and-migrations",
  },
];

const nextCodexIssues = [
  {
    id: "AWO-6",
    title: "Implement and test RLS policies",
    url: "https://linear.app/hatchvision/issue/AWO-6/implement-and-test-rls-policies",
  },
  {
    id: "AWO-7",
    title: "Document auth session model and admin bootstrap path",
    url: "https://linear.app/hatchvision/issue/AWO-7/document-auth-session-model-and-admin-bootstrap-path",
  },
  {
    id: "AWO-8",
    title: "Create V0.1 seed data plan",
    url: "https://linear.app/hatchvision/issue/AWO-8/create-v01-seed-data-plan",
  },
];

function IssueLink({
  issue,
}: {
  issue: {
    id: string;
    title: string;
    url: string;
  };
}) {
  return (
    <a
      className="block rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm hover:border-slate-300 hover:bg-white"
      href={issue.url}
    >
      <span className="font-semibold text-slate-950">{issue.id}</span>
      <span className="ml-2 text-slate-700">{issue.title}</span>
    </a>
  );
}

export default function BuildDashboardClient() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              GPT-Codex AWO
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Project Home
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Linear is now the source of truth for phases, issues, parking lot
              items, dependencies, and gate reviews.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/admin/logout"
            >
              Log out
            </a>
            <a
              className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              href={linearProjectUrl}
            >
              Open Linear Project
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Current Phase</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  V0.1 Security + Data/Auth is active. The immediate work is
                  production dashboard protection, Vercel env setup, and the
                  HatchVision-owned Supabase foundation.
                </p>
              </div>
              <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900">
                In Progress
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">Current Linear Focus</h2>
            <div className="mt-4 space-y-3">
              {activeIssues.map((issue) => (
                <IssueLink issue={issue} key={issue.id} />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">Next Codex Work</h2>
            <div className="mt-4 space-y-3">
              {nextCodexIssues.map((issue) => (
                <IssueLink issue={issue} key={issue.id} />
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">System Of Record</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use Linear for status, scope, parking lot, and phase decisions.
              Use this page only as a protected launch point.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">How To Work</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>Pick or create a Linear issue.</p>
              <p>Ask Codex to work that issue by ID, like AWO-5.</p>
              <p>Codex updates code, tests, docs, and Linear status.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
