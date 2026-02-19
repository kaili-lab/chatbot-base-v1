import { describe, expect, it } from "vitest";

import { registerSchema } from "./auth";

describe("registerSchema", () => {
  it("正确的注册数据通过验证", () => {
    const result = registerSchema.safeParse({
      name: "Alex",
      email: "alex@example.com",
      password: "password123",
      confirmPassword: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("邮箱格式错误被拒绝", () => {
    const result = registerSchema.safeParse({
      name: "Alex",
      email: "alexexample.com",
      password: "password123",
      confirmPassword: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("密码不一致被拒绝", () => {
    const result = registerSchema.safeParse({
      name: "Alex",
      email: "alex@example.com",
      password: "password123",
      confirmPassword: "password124",
    });

    expect(result.success).toBe(false);
  });

  it("密码少于 8 位被拒绝", () => {
    const result = registerSchema.safeParse({
      name: "Alex",
      email: "alex@example.com",
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
  });
});
