import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const adminCookieName = "awo_admin_session";

export async function GET() {
  const cookieStore = await cookies();

  cookieStore.delete(adminCookieName);

  redirect("/admin/login");
}
