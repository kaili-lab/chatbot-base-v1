"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import {
  Bot,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  SendHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

import { getLatestAssistantSources } from "@/app/(app)/chat/actions";
import type { ChatMessageRecord, ChatSettingsSummary } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessageItem } from "@/components/chat/chat-message-item";

const TITLE_MAX_LENGTH = 50;

type ChatThreadProps = {
  conversationId: string;
  title: string;
  initialMessages: ChatMessageRecord[];
  settings: ChatSettingsSummary;
  onTitleUpdate?: (conversationId: string, title: string) => void;
  onBackToList?: () => void;
  onToggleList?: () => void;
  isListCollapsed?: boolean;
};

function buildUiMessages(messages: ChatMessageRecord[]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: [{ type: "text", text: message.content }],
  }));
}

function createClientMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `local-${crypto.randomUUID()}`;
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extractText(message: UIMessage) {
  return message.parts
    .map((part) => {
      if (part.type !== "text") {
        return "";
      }
      return part.text;
    })
    .join("")
    .trim();
}

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const raw = error.message;
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      if (parsed?.error && typeof parsed.error === "string") {
        return parsed.error;
      }
    } catch {
    }
    return raw;
  }
  return "LLM 调用失败，请稍后重试";
}

export function ChatThread({
  conversationId,
  title,
  initialMessages,
  settings,
  onTitleUpdate,
  onBackToList,
  onToggleList,
  isListCollapsed,
}: ChatThreadProps) {
  const [input, setInput] = useState("");
  const [, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [failedMessage, setFailedMessage] = useState<{
    id: string;
    text: string;
    error: string;
  } | null>(null);
  const pendingMessageRef = useRef<{ id: string; text: string } | null>(null);
  const titleUpdatedRef = useRef(initialMessages.length > 0);
  const conversationIdRef = useRef(conversationId);

  const [sourcesById, setSourcesById] = useState(
    () => new Map(initialMessages.map((message) => [message.id, message.sources]))
  );

  useEffect(() => {
    setSourcesById(
      new Map(initialMessages.map((message) => [message.id, message.sources]))
    );
    titleUpdatedRef.current = initialMessages.length > 0;
  }, [conversationId, initialMessages]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const initialUiMessages = useMemo(
    () => buildUiMessages(initialMessages),
    [initialMessages]
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          conversationId,
        },
      }),
    [conversationId]
  );

  const { messages, status, sendMessage, setMessages, clearError } = useChat({
    id: conversationId,
    transport,
    messages: initialUiMessages,
    onFinish: (event) => {
      pendingMessageRef.current = null;
      setFailedMessage(null);
      if (event.message.role === "assistant") {
        const targetConversationId = conversationIdRef.current;
        const targetMessageId = event.message.id;
        startTransition(async () => {
          const result = await getLatestAssistantSources(targetConversationId);
          if (!result.success) {
            return;
          }
          if (conversationIdRef.current !== targetConversationId) {
            return;
          }
          if (result.sources) {
            setSourcesById((prev) => {
              const next = new Map(prev);
              next.set(targetMessageId, result.sources);
              return next;
            });
          }
        });
      }
    },
    onError: (error) => {
      const message = normalizeErrorMessage(error);
      const pending = pendingMessageRef.current;
      if (pending) {
        setFailedMessage({
          id: pending.id,
          text: pending.text,
          error: message,
        });
      } else {
        const fallback = [...messages].reverse().find((item) => item.role === "user");
        if (fallback) {
          setFailedMessage({
            id: fallback.id,
            text: extractText(fallback),
            error: message,
          });
        }
      }
      pendingMessageRef.current = null;
      toast.error(message);
      clearError();
    },
  });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });

    return () => cancelAnimationFrame(frame);
  }, [messages, status]);

  const maybeUpdateTitle = (content: string) => {
    if (titleUpdatedRef.current || initialMessages.length > 0) {
      return;
    }
    const nextTitle = content.slice(0, TITLE_MAX_LENGTH).trim();
    if (!nextTitle) {
      return;
    }
    titleUpdatedRef.current = true;
    onTitleUpdate?.(conversationId, nextTitle);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings.hasLlm || status !== "ready" || failedMessage) {
      return;
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    maybeUpdateTitle(trimmed);
    const messageId = createClientMessageId();
    pendingMessageRef.current = { id: messageId, text: trimmed };
    setFailedMessage(null);
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        role: "user",
        parts: [{ type: "text", text: trimmed }],
      },
    ]);
    await sendMessage({ text: trimmed, messageId });
    setInput("");
  };

  const showTypingIndicator = status === "submitted";
  const canSend = settings.hasLlm && status === "ready" && !failedMessage;
  const failureLabel = failedMessage
    ? `发送失败：${failedMessage.error || "请稍后重试"}`
    : "";
  const handleRetry = async () => {
    if (!failedMessage || status !== "ready") {
      return;
    }

    pendingMessageRef.current = {
      id: failedMessage.id,
      text: failedMessage.text,
    };
    setFailedMessage(null);
    await sendMessage({
      text: failedMessage.text,
      messageId: failedMessage.id,
    });
  };

  return (
    <div className="flex min-w-0 min-h-0 flex-1 flex-col">
      <div className="border-b px-5 py-3 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          {onBackToList && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onBackToList}
              aria-label="返回对话列表"
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}
          {onToggleList && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              onClick={onToggleList}
              aria-label={isListCollapsed ? "展开对话列表" : "收起对话列表"}
            >
              {isListCollapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </Button>
          )}
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Chat /</p>
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {title}
            </h1>
          </div>
          {settings.model && (
            <span className="rounded-full bg-[#ebf2ff] px-2 py-0.5 text-[11px] font-medium text-[#3b6fd9] dark:bg-[#1d355f] dark:text-[#8bb2ff]">
              {settings.model}
            </span>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto px-6 py-6">
        {!settings.hasLlm && (
          <div className="mb-4 rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            请先在设置中配置 LLM API。{" "}
            <Link href="/settings" className="text-[#2f6df6] hover:underline">
              前往设置
            </Link>
          </div>
        )}
        {settings.hasLlm && !settings.embeddingReady && (
          <div className="mb-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            检测到 Embedding 模型未保存，已临时使用默认模型。建议前往设置保存，以避免检索不一致。
            <Link href="/settings" className="ml-1 text-amber-700 underline dark:text-amber-200">
              前往设置
            </Link>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <p className="text-sm">这里会展示你的对话内容。</p>
            <p className="mt-2 text-xs">在下方输入问题开始对话。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                sources={sourcesById.get(message.id) ?? null}
                failure={
                  failedMessage?.id === message.id
                    ? {
                        message: failureLabel,
                        onRetry: handleRetry,
                        disabled: status !== "ready",
                      }
                    : null
                }
              />
            ))}
            {showTypingIndicator && (
              <div className="flex max-w-[560px] items-start gap-2">
                <div className="mt-0.5 rounded-full bg-[#edf4ff] p-1.5 text-[#2f6df6]">
                  <Bot className="size-4" />
                </div>
                <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm dark:border-zinc-700 dark:bg-[#17191d]">
                  正在思考...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t px-6 py-4 dark:border-zinc-800">
        <div className="mx-auto max-w-[680px]">
          <form onSubmit={handleSubmit} className="relative">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question about your documents..."
              disabled={!canSend}
              className={cn(
                "h-11 rounded-xl border bg-muted pr-12 text-sm dark:border-zinc-700 dark:bg-[#131518]",
                (!settings.hasLlm || failedMessage) && "cursor-not-allowed"
              )}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-1.5 top-1/2 size-8 -translate-y-1/2 text-muted-foreground"
              aria-label="发送消息"
              disabled={!canSend}
            >
              <SendHorizontal className="size-4" />
            </Button>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
