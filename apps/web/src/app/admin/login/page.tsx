import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

const adminCookieName = "awo_admin_session";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

async function login(formData: FormData) {
  "use server";

  const adminPassword = process.env.AWO_ADMIN_PASSWORD;
  const sessionToken = process.env.AWO_ADMIN_SESSION_TOKEN ?? adminPassword;
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin/build");
  const safeNext = next.startsWith("/admin") ? next : "/admin/build";

  if (!adminPassword || !sessionToken) {
    redirect("/admin/login?setup=1");
  }

  if (password !== adminPassword) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(safeNext)}`);
  }

  const cookieStore = await cookies();

  cookieStore.set(adminCookieName, sessionToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect(safeNext);
}

export default async function AdminLoginPage({
  searchParams,
}: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const setupMissing = getParam(params, "setup") === "1";
  const hasError = getParam(params, "error") === "1";
  const next = getParam(params, "next") ?? "/admin/build";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f4ef] px-5 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
          GPT-Codex AWO
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Admin Access</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter the HatchVision dashboard password to continue.
        </p>

        {setupMissing ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            Set the `AWO_ADMIN_PASSWORD` environment variable in Vercel before
            using the production dashboard.
          </div>
        ) : null}

        {hasError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
            That password did not match.
          </div>
        ) : null}

        <LoginForm action={login} next={next} />
      </section>
    </main>
  );
}
