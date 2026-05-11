import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const adminCookieName = "awo_admin_session";
const adminUserCookieName = "awo_admin_user_id";

export async function GET() {
  const cookieStore = await cookies();

  cookieStore.delete(adminCookieName);
  cookieStore.delete(adminUserCookieName);

  redirect("/admin/login");
}
