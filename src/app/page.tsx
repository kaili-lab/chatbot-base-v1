import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Chatbot Base",
  description: "RAG-powered knowledge base chatbot",
};

// 首页占位，Task 05 实现完整落地页
// 已登录用户将由 middleware 重定向到 /chat（Task 09 实现）
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Chatbot Base</h1>
      <p className="text-muted-foreground">RAG-powered knowledge base chatbot</p>
      {/* shadcn/ui 和主题验证用 - Task 05 实现后移除 */}
      <div className="flex gap-2">
        <Button>Primary Button</Button>
        <Button variant="outline">Outline Button</Button>
      </div>
    </div>
  );
}
