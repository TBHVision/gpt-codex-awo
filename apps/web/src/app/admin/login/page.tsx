import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  canUseSupabaseAdminLogin,
  verifySupabaseAdminLogin,
} from "@/lib/admin-auth";
import LoginForm from "./LoginForm";

const adminCookieName = "awo_admin_session";
const adminUserCookieName = "awo_admin_user_id";

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

function temporaryPasswordEnabled() {
  return process.env.AWO_DISABLE_TEMP_ADMIN_PASSWORD !== "true";
}

async function login(formData: FormData) {
  "use server";

  const adminPassword = process.env.AWO_ADMIN_PASSWORD;
  const sessionToken = process.env.AWO_ADMIN_SESSION_TOKEN ?? adminPassword;
  const canUseTemporaryPassword = temporaryPasswordEnabled();
  const mode = String(formData.get("mode") ?? "password");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin/build");
  const safeNext = next.startsWith("/admin") ? next : "/admin/build";

  if (!sessionToken) {
    redirect("/admin/login?setup=1");
  }

  if (mode === "supabase") {
    const result = await verifySupabaseAdminLogin({ email, password });

    if (!result.ok) {
      redirect(
        `/admin/login?error=${result.reason}&next=${encodeURIComponent(safeNext)}`,
      );
    }

    const cookieStore = await cookies();

    cookieStore.set(adminCookieName, sessionToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: "/admin",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    cookieStore.set(adminUserCookieName, result.userId, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: "/admin",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    redirect(safeNext);
  } else {
    if (!canUseTemporaryPassword) {
      redirect(`/admin/login?error=temp_disabled&next=${encodeURIComponent(safeNext)}`);
    }

    if (!adminPassword) {
      redirect("/admin/login?setup=1");
    }

    if (password !== adminPassword) {
      redirect(`/admin/login?error=1&next=${encodeURIComponent(safeNext)}`);
    }
  }

  const cookieStore = await cookies();

  cookieStore.set(adminCookieName, sessionToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  cookieStore.delete(adminUserCookieName);

  redirect(safeNext);
}

export default async function AdminLoginPage({
  searchParams,
}: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const setupMissing = getParam(params, "setup") === "1";
  const error = getParam(params, "error");
  const next = getParam(params, "next") ?? "/admin/build";
  const supabaseAdminLoginEnabled = canUseSupabaseAdminLogin();
  const canUseTemporaryPassword = temporaryPasswordEnabled();
  const temporaryPasswordProductionRisk =
    canUseTemporaryPassword && process.env.VERCEL_ENV === "production";

  const errorMessage =
    error === "1"
      ? "That dashboard password did not match."
      : error === "bad_credentials"
        ? "That Supabase email/password did not match."
        : error === "not_admin"
          ? "That Supabase user is not marked as an AWO admin."
          : error === "missing_config"
            ? "Supabase admin login is not configured yet."
            : error === "temp_disabled"
              ? "Temporary password login is disabled for this environment."
            : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f4ef] px-5 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
          GPT-Codex AWO
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Admin Access</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use a Supabase admin account when available, or the temporary
          HatchVision dashboard password while the named-admin flow is being
          phased in.
        </p>

        {setupMissing ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            Set the `AWO_ADMIN_PASSWORD` environment variable in Vercel before
            using the production dashboard.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
            {errorMessage}
          </div>
        ) : null}

        <LoginForm
          action={login}
          next={next}
          supabaseAdminLoginEnabled={supabaseAdminLoginEnabled}
          temporaryPasswordEnabled={canUseTemporaryPassword}
          temporaryPasswordProductionRisk={temporaryPasswordProductionRisk}
        />
      </section>
    </main>
  );
}
