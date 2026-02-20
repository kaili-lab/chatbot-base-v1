import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          404
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">页面不存在</h1>
        <p className="text-sm text-muted-foreground">
          你访问的页面可能已被移动或删除。
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/chat">返回 Chat</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/documents">前往 Documents</Link>
        </Button>
      </div>
    </div>
  );
}
