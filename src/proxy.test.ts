import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { config, proxy } from "./proxy";

function createRequest(url: string, withSession = false) {
  const headers = withSession
    ? { cookie: "better-auth.session_token=fake-session-token" }
    : undefined;

  return new NextRequest(url, { headers });
}

describe("proxy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("matcher 包含需要保护的路由", () => {
    const matcher = config.matcher as string[];

    expect(matcher).toContain("/");
    expect(matcher).toContain("/login");
    expect(matcher).toContain("/register");
    expect(matcher).toContain("/chat/:path*");
    expect(matcher).toContain("/documents/:path*");
    expect(matcher).toContain("/settings/:path*");
  });

  it("未登录访问受保护路由返回重定向响应", async () => {
    const response = await proxy(createRequest("http://localhost/chat"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("API 路由不受中间件拦截", async () => {
    const response = await proxy(createRequest("http://localhost/api/auth/session"));

    expect((config.matcher as string[]).some((matcher) => matcher.startsWith("/api"))).toBe(false);
    expect(response.headers.get("location")).toBeNull();
  });

  it("已登录访问登录页会重定向到 /chat", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ user: { id: "user-1" } }), { status: 200 })
    );

    const response = await proxy(createRequest("http://localhost/login", true));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/chat");
  });

  it("无效会话 cookie 访问受保护路由会清理 cookie 并跳转登录页", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("null", { status: 200 })
    );

    const response = await proxy(createRequest("http://localhost/chat", true));
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
    expect(setCookie).toContain("better-auth.session_token=;");
  });
});
