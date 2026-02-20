"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          发生错误
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">页面加载失败</h1>
        <p className="text-sm text-muted-foreground">
          请稍后重试，或返回聊天首页继续操作。
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          重试
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/chat">返回 Chat</Link>
        </Button>
      </div>
    </div>
  );
}
