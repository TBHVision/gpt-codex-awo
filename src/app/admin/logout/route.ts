import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookieName, adminUserCookieName } from "@/lib/admin-session";

export async function GET() {
  const cookieStore = await cookies();

  cookieStore.delete(adminCookieName);
  cookieStore.delete(adminUserCookieName);

  redirect("/admin/login");
}
