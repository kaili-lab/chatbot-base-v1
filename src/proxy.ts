import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const guestOnlyRoutes = new Set(["/login", "/register"]);
const protectedRoutePrefixes = ["/chat", "/documents", "/settings"];
const authCookieNames = [
  "better-auth.session_token",
  "better-auth.session_data",
  "better-auth.dont_remember",
  "better-auth.account_data",
  "__Secure-better-auth.session_token",
  "__Secure-better-auth.session_data",
  "__Secure-better-auth.dont_remember",
  "__Secure-better-auth.account_data",
];

function isProtectedRoute(pathname: string) {
  return protectedRoutePrefixes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

async function hasValidSession(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return false;
  }

  try {
    // WHAT: 通过 Better Auth 会话接口二次校验 cookie；WHY: 仅凭 session_token 存在无法判断会话是否已过期/失效，会触发 /chat 的重定向循环。
    const response = await fetch(new URL("/api/auth/get-session", request.url), {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const session = (await response.json()) as { user?: { id?: string } } | null;
    return Boolean(session?.user?.id);
  } catch {
    return false;
  }
}

function clearAuthCookies(response: NextResponse) {
  for (const cookieName of authCookieNames) {
    response.cookies.delete(cookieName);
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(getSessionCookie(request));
  const hasSession = hasSessionCookie ? await hasValidSession(request) : false;

  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (guestOnlyRoutes.has(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (isProtectedRoute(pathname) && !hasSession) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // WHAT: 清理已失效 cookie；WHY: 避免后续请求继续被判定为“已登录”，反复进入受保护路由。
    if (hasSessionCookie) {
      clearAuthCookies(response);
    }
    return response;
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
