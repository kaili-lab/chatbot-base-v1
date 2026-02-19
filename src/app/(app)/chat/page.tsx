import type { Metadata } from "next";
import {
  Bot,
  Ellipsis,
  MessageSquare,
  Plus,
  SendHorizontal,
  Sparkles,
  Star,
  Trash2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Chat - Chatbot Base" };

const mockChats = [
  {
    id: "q3",
    title: "Q3 Financial Analysis",
    date: "2/18/2026",
    active: true,
    starred: true,
  },
  {
    id: "hr",
    title: "HR Policy Inquiry",
    date: "2/17/2026",
    active: false,
    starred: false,
  },
];

export default function ChatPage() {
  return (
    <div className="flex h-full min-h-0 bg-white dark:bg-[#0a0a0a]">
      <aside className="hidden w-[300px] shrink-0 border-r bg-[#f8fafc] p-3 dark:border-zinc-800 dark:bg-[#111315] lg:flex lg:flex-col">
        <div className="flex items-center gap-2">
          <Button className="h-9 flex-1 justify-start bg-[#2f6df6] hover:bg-[#265fdb]">
            <Plus className="size-4" />
            New Chat
          </Button>
          <Button variant="outline" size="icon" className="size-9 bg-white dark:bg-[#1a1d21]">
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="mt-3 space-y-1">
          {mockChats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              className={`flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${
                chat.active
                  ? "bg-[#e9eff7] dark:bg-[#1f2b3d]"
                  : "hover:bg-muted dark:hover:bg-zinc-800"
              }`}
            >
              <MessageSquare className="mt-0.5 size-4 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground/90 dark:text-zinc-100">
                  {chat.title}
                </span>
                <span className="block text-xs text-muted-foreground">{chat.date}</span>
              </span>
              {chat.starred && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
              {chat.active && <Ellipsis className="size-3.5 text-muted-foreground" />}
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="border-b px-5 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">Q3 Financial Analysis</h1>
            <span className="rounded-full bg-[#ebf2ff] px-2 py-0.5 text-[11px] font-medium text-[#3b6fd9] dark:bg-[#1d355f] dark:text-[#8bb2ff]">
              gemini-3 flash-preview
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="ml-auto mb-4 flex max-w-[420px] items-start gap-2">
            <div className="rounded-2xl bg-[#2f6df6] px-4 py-3 text-sm text-white shadow-sm">
              What was the revenue growth in Q3?
            </div>
            <div className="mt-0.5 rounded-full bg-[#e9eff7] p-1.5 text-[#2f6df6]">
              <User className="size-4" />
            </div>
          </div>

          <div className="mb-2 flex max-w-[560px] items-start gap-2">
            <div className="mt-0.5 rounded-full bg-[#edf4ff] p-1.5 text-[#2f6df6]">
              <Bot className="size-4" />
            </div>
            <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-foreground/90 dark:border-zinc-700 dark:bg-[#17191d] dark:text-zinc-100">
              According to the Q3 Financial Report, revenue grew by 15%
              year-over-year.
            </div>
          </div>

          <div className="ml-9 max-w-[560px] space-y-2">
            <p className="text-xs text-muted-foreground">1 Sources referenced</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#edf4ff] px-2 py-1 text-xs font-medium text-[#3b6fd9] dark:bg-[#1b2b45] dark:text-[#9bc0ff]">
              <Sparkles className="size-3" />
              Q3 Growth Analysis
            </span>
          </div>
        </div>

        <div className="border-t px-6 py-4 dark:border-zinc-800">
          <div className="mx-auto max-w-[680px]">
            <div className="relative">
              <Input
                readOnly
                value=""
                placeholder="Ask a question about your documents..."
                className="h-11 rounded-xl border bg-muted pr-12 text-sm dark:border-zinc-700 dark:bg-[#131518]"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1.5 top-1/2 size-8 -translate-y-1/2 text-muted-foreground"
                aria-label="发送消息"
              >
                <SendHorizontal className="size-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
