"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, ChevronDown, Sparkles, User } from "lucide-react";
import type { UIMessage } from "ai";

import type { MessageSource } from "@/lib/chat/types";
import { SafeMarkdownPreview } from "@/components/markdown/safe-markdown-preview";
import { cn } from "@/lib/utils";

function extractText(message: UIMessage) {
  return message.parts
    .map((part) => {
      if (part.type !== "text") {
        return "";
      }
      return part.text;
    })
    .join("");
}

type ChatMessageItemProps = {
  message: UIMessage;
  sources?: MessageSource | null;
  failure?: {
    message: string;
    onRetry?: () => void;
    disabled?: boolean;
  } | null;
};

export function ChatMessageItem({
  message,
  sources,
  failure,
}: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const content = extractText(message);
  const uniqueSources =
    !isUser && sources?.type === "knowledge_base"
      ? Array.from(
          // WHY: 同一文档会被切成多个 chunk，这里按 documentId 去重，避免来源显示重复。
          new Map(sources.chunks.map((chunk) => [chunk.documentId, chunk])).values()
        )
      : [];
  const showSources = uniqueSources.length > 0;
  const showFailure = isUser && failure?.message;
  const sourceSummary = !isUser
    ? showSources
      ? `来源：知识库（${uniqueSources.length}）`
      : "来源：未检索到知识库，回答基于通用模型能力"
    : null;

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "flex max-w-[560px] items-start gap-2",
          isUser ? "ml-auto" : "mb-2"
        )}
      >
        {!isUser && (
          <div className="mt-0.5 rounded-full bg-[#edf4ff] p-1.5 text-[#2f6df6]">
            <Bot className="size-4" />
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm shadow-sm",
            isUser
              ? "bg-[#2f6df6] text-white"
              : "border bg-white text-foreground/90 dark:border-zinc-700 dark:bg-[#17191d] dark:text-zinc-100"
          )}
        >
          {isUser ? (
            content
          ) : content ? (
            <SafeMarkdownPreview source={content} />
          ) : (
            "..."
          )}
        </div>
        {isUser && (
          <div className="mt-0.5 rounded-full bg-[#e9eff7] p-1.5 text-[#2f6df6]">
            <User className="size-4" />
          </div>
        )}
      </div>

      {!isUser && sourceSummary && (
        <div className="mt-1 ml-9 max-w-[560px] text-xs text-muted-foreground">
          {sourceSummary}
        </div>
      )}

      {showFailure && (
        <div className="mt-1 flex max-w-[560px] items-center justify-end gap-2 text-xs text-destructive">
          <span>{failure.message}</span>
          {failure.onRetry && (
            <button
              type="button"
              onClick={failure.onRetry}
              disabled={failure.disabled}
              className={cn(
                "rounded-full border border-destructive/40 px-2 py-0.5 text-destructive transition",
                failure.disabled
                  ? "cursor-not-allowed opacity-60"
                  : "hover:bg-destructive/10"
              )}
            >
              重试
            </button>
          )}
        </div>
      )}

      {showSources && (
        <div className="ml-9 max-w-[560px] space-y-2">
          <button
            type="button"
            onClick={() => setSourcesOpen((prev) => !prev)}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <ChevronDown
              className={cn("size-3 transition", sourcesOpen && "rotate-180")}
            />
            <span>{uniqueSources.length} Sources referenced</span>
          </button>

          {sourcesOpen && (
            <div className="flex flex-wrap gap-2">
              {uniqueSources.map((chunk) => (
                <Link
                  key={chunk.documentId}
                  href={`/documents/${chunk.documentId}`}
                  className="inline-flex items-center gap-1 rounded-full bg-[#edf4ff] px-2 py-1 text-xs font-medium text-[#3b6fd9] transition hover:bg-[#e3edff] dark:bg-[#1b2b45] dark:text-[#9bc0ff]"
                >
                  <Sparkles className="size-3" />
                  {chunk.fileName}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
