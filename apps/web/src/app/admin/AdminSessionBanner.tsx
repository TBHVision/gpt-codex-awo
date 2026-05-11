import { cookies } from "next/headers";
import Link from "next/link";

const adminUserCookieName = "awo_admin_user_id";

export async function AdminSessionBanner() {
  const cookieStore = await cookies();
  const adminUserId = cookieStore.get(adminUserCookieName)?.value;
  const label = adminUserId ? "Named admin session" : "Temporary password session";

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
      <span className="max-w-full break-words">{label}</span>
      <Link className="text-slate-950 underline-offset-4 hover:underline" href="/admin/logout">
        Log out
      </Link>
    </div>
  );
}
