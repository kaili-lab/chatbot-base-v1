import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ResendVerificationButton } from "./resend-verification-button";

export const metadata: Metadata = { title: "Verify Email - Chatbot Base" };

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string;
    token?: string;
    callbackURL?: string;
  }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { email, token, callbackURL } = await searchParams;
  const isResendTestMode =
    (process.env.RESEND_FROM ?? "").toLowerCase().includes("onboarding@resend.dev");

  // 兼容旧链接：如果访问的是前端 /verify-email?token=xxx，转发给 Better Auth API 完成真正校验
  if (token) {
    const query = new URLSearchParams({
      token,
      callbackURL: callbackURL ?? "/login?verified=1",
    });

    redirect(`/api/auth/verify-email?${query.toString()}`);
  }

  const emailText = email ?? "your@email.com";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950">
            <Mail className="size-5" />
          </div>
          <CardTitle className="text-xl">验证你的邮箱</CardTitle>
          <p className="text-sm text-muted-foreground">
            我们已向 {emailText} 发送验证邮件，请查收并点击链接完成验证。
          </p>
        </CardHeader>
        <CardContent>
          {isResendTestMode && (
            <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              当前是 Resend 测试发信模式，验证邮件会转发到 Resend 账号邮箱（不是注册邮箱）。
            </p>
          )}
          <ResendVerificationButton email={email ?? null} />
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm font-medium text-blue-600">
            返回登录
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
