import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const authBaseUrl = process.env.BETTER_AUTH_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;

if (!authBaseUrl) {
  // 提前校验环境变量，避免运行期才暴露配置问题
  throw new Error("BETTER_AUTH_URL is not set");
}

if (!authSecret) {
  // 提前校验环境变量，避免运行期才暴露配置问题
  throw new Error("BETTER_AUTH_SECRET is not set");
}

export const auth = betterAuth({
  baseURL: authBaseUrl,
  secret: authSecret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
});
