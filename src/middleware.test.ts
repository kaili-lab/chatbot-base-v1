import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { config, middleware } from "./middleware";

function createRequest(url: string, withSession = false) {
  const headers = withSession
    ? { cookie: "better-auth.session_token=fake-session-token" }
    : undefined;

  return new NextRequest(url, { headers });
}

describe("middleware", () => {
  it("matcher 包含需要保护的路由", () => {
    const matcher = config.matcher as string[];

    expect(matcher).toContain("/");
    expect(matcher).toContain("/login");
    expect(matcher).toContain("/register");
    expect(matcher).toContain("/chat/:path*");
    expect(matcher).toContain("/documents/:path*");
    expect(matcher).toContain("/settings/:path*");
  });

  it("未登录访问受保护路由返回重定向响应", () => {
    const response = middleware(createRequest("http://localhost/chat"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("API 路由不受中间件拦截", () => {
    const response = middleware(createRequest("http://localhost/api/auth/session"));

    expect((config.matcher as string[]).some((matcher) => matcher.startsWith("/api"))).toBe(false);
    expect(response.headers.get("location")).toBeNull();
  });

  it("已登录访问登录页会重定向到 /chat", () => {
    const response = middleware(createRequest("http://localhost/login", true));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/chat");
  });
});
