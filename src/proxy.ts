import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROOM_ID_REGEX } from "./lib/roomId";

/**
 * Proxy middleware routing interception for Next.js 16.
 * Enforces valid meeting room code formatting and injects essential security headers.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname format matches a valid room ID (e.g., /abc-abcd-abc)
  const cleanPath = pathname.substring(1);
  const isValidRoom = ROOM_ID_REGEX.test(cleanPath);

  const isAsset =
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".");

  if (pathname !== "/" && !isAsset && !isValidRoom) {
    // Redirect invalid room IDs to home page with query param error
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("error", "invalid-room");
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // Inject essential security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  return response;
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
