import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const guestOnlyRoutes = new Set(["/login", "/register"]);
const protectedRoutePrefixes = ["/chat", "/documents", "/settings"];

function isProtectedRoute(pathname: string) {
  return protectedRoutePrefixes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (guestOnlyRoutes.has(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (isProtectedRoute(pathname) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/chat/:path*",
    "/documents/:path*",
    "/settings/:path*",
  ],
};
