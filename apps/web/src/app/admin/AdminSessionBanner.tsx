import { cookies } from "next/headers";
import Link from "next/link";

const adminUserCookieName = "awo_admin_user_id";

export async function AdminSessionBanner() {
  const cookieStore = await cookies();
  const adminUserId = cookieStore.get(adminUserCookieName)?.value;
  const isNamedAdmin = Boolean(adminUserId);
  const label = isNamedAdmin ? "Named admin session" : "Temporary password session";
  const detail = isNamedAdmin
    ? "write-capable where enabled"
    : "fallback mode; keep launch review cautious";

  return (
    <div
      className={`flex min-w-0 flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${
        isNamedAdmin
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <span className="max-w-full break-words">{label}</span>
      <span className="text-current/75">{detail}</span>
      <Link className="text-current underline-offset-4 hover:underline" href="/admin/launch">
        Auth policy
      </Link>
      <Link className="text-current underline-offset-4 hover:underline" href="/admin/logout">
        Log out
      </Link>
    </div>
  );
}
