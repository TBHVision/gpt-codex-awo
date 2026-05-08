import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f4ef] px-5 text-slate-950">
      <section className="w-full max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
          GPT-Codex AWO
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
          Separate tenant. Visible gates. Enterprise-grade path.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          This instance starts with the build-version dashboard so every phase,
          agent lane, dependency, test, blocker, and Tony review point is visible
          before the product build accelerates.
        </p>
        <Link
          className="mt-8 inline-flex h-12 items-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
          href="/admin/build"
        >
          Open Build Dashboard
        </Link>
      </section>
    </main>
  );
}
