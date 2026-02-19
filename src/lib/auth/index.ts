import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendVerificationEmail } from "@/lib/email";

const authBaseUrl = process.env.BETTER_AUTH_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!authBaseUrl) {
  // 提前校验环境变量，避免运行期才暴露配置问题
  throw new Error("BETTER_AUTH_URL is not set");
}

if (!authSecret) {
  // 提前校验环境变量，避免运行期才暴露配置问题
  throw new Error("BETTER_AUTH_SECRET is not set");
}

if (!googleClientId) {
  throw new Error("GOOGLE_CLIENT_ID is not set");
}

if (!googleClientSecret) {
  throw new Error("GOOGLE_CLIENT_SECRET is not set");
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
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    // 统一在服务端发送验证邮件，避免客户端拼接链接导致回调地址不一致
    sendVerificationEmail: async ({ user, token }) => {
      await sendVerificationEmail(user.email, token);
    },
  },
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
});
