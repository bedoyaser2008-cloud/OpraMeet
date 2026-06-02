import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROOM_ID_REGEX } from "./lib/roomId";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through root path
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Pass through api routes, next static, images, favicon, public assets
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if pathname format matches a valid room ID (e.g., /abc-abcd-abc)
  // The clean path removes the leading slash
  const cleanPath = pathname.substring(1);
  if (ROOM_ID_REGEX.test(cleanPath)) {
    return NextResponse.next();
  }

  // Redirect invalid room IDs to home page with query param error
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("error", "invalid-room");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
