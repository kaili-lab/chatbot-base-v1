import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FileText, Hexagon, MessageSquare, Search } from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Chatbot Base",
  description: "RAG-powered knowledge base chatbot",
};

const features = [
  {
    icon: FileText,
    title: "Smart Document Parsing",
    description:
      "Upload PDF, DOCX, or TXT files. We automatically index and structure your knowledge.",
  },
  {
    icon: Search,
    title: "Semantic Retrieval",
    description:
      "Don't just match keywords. Find the exact context relevant to your specific question.",
  },
  {
    icon: MessageSquare,
    title: "Grounded Answers",
    description:
      "AI responses cite their sources, so you can always verify the information.",
  },
];

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/chat");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#2f6df6] text-white">
              <Hexagon className="size-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Agent</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="bg-[#2f6df6] hover:bg-[#265fdb]">
              <Link href="/register">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b bg-white px-4 py-20 text-center lg:py-28">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-[#2f6df6] sm:text-5xl">
              Intelligent Knowledge Base &amp;
              <br />
              Q&amp;A Assistant
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-500">
              Transform your documents into an interactive knowledge engine.
              Upload files, ask complex questions, and get precise, cited answers instantly.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="min-w-[160px] bg-[#2f6df6] hover:bg-[#265fdb]">
                <Link href="/register">Start for free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="min-w-[140px] bg-slate-50">
                <Link href="/login">View Demo</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-4 py-14">
          <div className="mx-auto grid w-full max-w-[820px] gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title} className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-[#edf4ff] text-[#2f6df6]">
                    <Icon className="size-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
