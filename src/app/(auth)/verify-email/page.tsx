import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Verify Email - Chatbot Base" };

type VerifyEmailPageProps = {
  searchParams?: {
    email?: string;
  };
};

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const email = searchParams?.email ?? "your@email.com";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950">
            <Mail className="size-5" />
          </div>
          <CardTitle className="text-xl">验证你的邮箱</CardTitle>
          <p className="text-sm text-muted-foreground">
            我们已向 {email} 发送验证邮件，请查收并点击链接完成验证。
          </p>
        </CardHeader>
        <CardContent>
          <Button className="w-full" disabled>
            重新发送验证邮件
          </Button>
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
