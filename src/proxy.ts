import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  adminCookieName,
  adminUserCookieName,
  temporaryPasswordEnabled,
  verifyAdminUserCookie,
} from "@/lib/admin-session";

function withNoIndex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicAdminRoute =
    pathname.startsWith("/admin/login") || pathname.startsWith("/admin/logout");

  if (isAdminRoute && !isPublicAdminRoute) {
    const adminPassword = process.env.AWO_ADMIN_PASSWORD;
    const sessionToken = process.env.AWO_ADMIN_SESSION_TOKEN ?? adminPassword;
    const namedAdminRequired = !temporaryPasswordEnabled();
    const canUseSupabaseAdminLogin = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        sessionToken,
    );
    const sessionCookie = request.cookies.get(adminCookieName)?.value;
    const adminUserCookie = request.cookies.get(adminUserCookieName)?.value;
    const verifiedAdminUserId = namedAdminRequired
      ? await verifyAdminUserCookie(adminUserCookie, sessionToken)
      : null;

    if (
      !sessionToken ||
      sessionCookie !== sessionToken ||
      (namedAdminRequired && !verifiedAdminUserId)
    ) {
      const loginUrl = request.nextUrl.clone();

      loginUrl.pathname = "/admin/login";
      loginUrl.search = "";

      if (!adminPassword && !canUseSupabaseAdminLogin) {
        loginUrl.searchParams.set("setup", "1");
      } else {
        loginUrl.searchParams.set("next", `${pathname}${search}`);

        if (namedAdminRequired && sessionCookie === sessionToken) {
          loginUrl.searchParams.set("error", "temp_disabled");
        }
      }

      return withNoIndex(NextResponse.redirect(loginUrl));
    }
  }

  return withNoIndex(NextResponse.next());
}
