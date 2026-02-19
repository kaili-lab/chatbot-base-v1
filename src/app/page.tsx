import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FileUp, Hexagon, Search, Sparkles } from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Chatbot Base",
  description: "RAG-powered knowledge base chatbot",
};

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/chat");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Hexagon className="size-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Agent</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">登录</Link>
            </Button>
            <Button asChild>
              <Link href="/register">注册</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 pb-20 pt-16 text-center lg:px-6 lg:pt-24">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-blue-600 sm:text-4xl lg:text-5xl">
            智能知识库问答助手
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            将你的文档变成可交互的知识引擎，支持上传、语义检索与精准问答。
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/register">开始使用</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">查看演示</Link>
            </Button>
          </div>
        </div>

        <section className="mt-14 grid w-full gap-6 text-left md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950">
                <FileUp className="size-5" />
              </div>
              <CardTitle className="text-base">智能文档解析</CardTitle>
              <CardDescription>
                支持 PDF、DOCX、TXT 等格式自动解析与结构化。
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950">
                <Search className="size-5" />
              </div>
              <CardTitle className="text-base">语义检索</CardTitle>
              <CardDescription>
                不止关键词匹配，找到与你问题最相关的上下文。
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950">
                <Sparkles className="size-5" />
              </div>
              <CardTitle className="text-base">可信答案</CardTitle>
              <CardDescription>
                AI 回复带来源引用，重要信息可追溯验证。
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="mx-auto w-full max-w-6xl px-4 text-center text-sm text-muted-foreground lg:px-6">
          © 2026 Agent. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
