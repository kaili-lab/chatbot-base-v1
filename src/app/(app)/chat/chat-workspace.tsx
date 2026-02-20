"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ellipsis, MessageSquare, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createConversation,
  deleteConversation,
  deleteUnstarredConversations,
  renameConversation,
  toggleStar,
} from "@/app/(app)/chat/actions";
import type {
  ChatConversationSummary,
  ChatMessageRecord,
  ChatSettingsSummary,
} from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { ChatThread } from "@/components/chat/chat-thread";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

type ChatWorkspaceProps = {
  conversations: ChatConversationSummary[];
  activeConversation: ChatConversationSummary | null;
  initialMessages: ChatMessageRecord[];
  lastMessageAt: string | null;
  settings: ChatSettingsSummary;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-US");
}

export function ChatWorkspace({
  conversations,
  activeConversation,
  initialMessages,
  lastMessageAt,
  settings,
}: ChatWorkspaceProps) {
  const router = useRouter();
  const [isMutating, startTransition] = useTransition();

  const [conversationList, setConversationList] = useState(
    conversations
  );
  const [currentConversation, setCurrentConversation] = useState(activeConversation);
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">(
    activeConversation ? "chat" : "list"
  );

  const [renamingConversation, setRenamingConversation] = useState<
    ChatConversationSummary | null
  >(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState<
    ChatConversationSummary | null
  >(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    setMobileView(activeConversation ? "chat" : "list");
  }, [activeConversation?.id]);

  useEffect(() => {
    setConversationList(conversations);
  }, [conversations]);

  useEffect(() => {
    setCurrentConversation(activeConversation);
  }, [
    activeConversation?.id,
    activeConversation?.title,
    activeConversation?.starred,
    activeConversation?.createdAt,
    activeConversation?.updatedAt,
  ]);

  const conversationKey = useMemo(() => {
    if (!currentConversation) {
      return "empty";
    }
    return `${currentConversation.id}-${lastMessageAt ?? "none"}`;
  }, [currentConversation, lastMessageAt]);

  const deletableCount = useMemo(
    () => conversationList.filter((item) => !item.starred).length,
    [conversationList]
  );
  const hasDeletable = deletableCount > 0;

  const normalizeDate = (value: string | Date) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  };

  const sortConversations = (items: ChatConversationSummary[]) =>
    [...items].sort((a, b) => {
      if (a.starred !== b.starred) {
        return a.starred ? -1 : 1;
      }
      const timeA = new Date(a.updatedAt).getTime();
      const timeB = new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });

  const updateConversationList = (
    updater: (prev: ChatConversationSummary[]) => ChatConversationSummary[],
    shouldSort: boolean = false
  ) => {
    setConversationList((prev) => {
      const next = updater(prev);
      return shouldSort ? sortConversations(next) : next;
    });
  };

  const mapConversation = (conversation: {
    id: string;
    title: string;
    starred: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
  }): ChatConversationSummary => ({
    id: conversation.id,
    title: conversation.title,
    starred: conversation.starred,
    createdAt: normalizeDate(conversation.createdAt),
    updatedAt: normalizeDate(conversation.updatedAt),
  });

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/chat?id=${conversationId}`);
    setMobileView("chat");
  };

  const handleCreateConversation = () => {
    startTransition(async () => {
      const result = await createConversation();
      if (!result.success || !result.conversation) {
        toast.error(result.message ?? "创建对话失败");
        return;
      }

      const nextConversation = mapConversation(result.conversation);
      updateConversationList(
        (prev) => [nextConversation, ...prev.filter((item) => item.id !== nextConversation.id)],
        true
      );
      setCurrentConversation(nextConversation);
      router.push(`/chat?id=${result.conversation.id}`);
      setMobileView("chat");
    });
  };

  const handleToggleStar = (conversationId: string) => {
    startTransition(async () => {
      const result = await toggleStar(conversationId);
      if (!result.success) {
        toast.error(result.message ?? "更新星标失败");
        return;
      }
      if (result.conversation) {
        const nextConversation = mapConversation(result.conversation);
        updateConversationList(
          (prev) =>
            prev.map((item) => (item.id === nextConversation.id ? nextConversation : item)),
          true
        );
        if (currentConversation?.id === nextConversation.id) {
          setCurrentConversation(nextConversation);
        }
      }
    });
  };

  const handleRenameSubmit = () => {
    if (!renamingConversation) {
      return;
    }

    startTransition(async () => {
      const result = await renameConversation(renamingConversation.id, renameValue);
      if (!result.success) {
        toast.error(result.message ?? "重命名失败");
        return;
      }

      if (result.conversation) {
        const nextConversation = mapConversation(result.conversation);
        updateConversationList((prev) =>
          prev.map((item) => (item.id === nextConversation.id ? nextConversation : item))
        );
        if (currentConversation?.id === nextConversation.id) {
          setCurrentConversation(nextConversation);
        }
      }
      setRenamingConversation(null);
      setRenameValue("");
    });
  };

  const handleDeleteConversation = () => {
    if (!pendingDelete) {
      return;
    }

    startTransition(async () => {
      const result = await deleteConversation(pendingDelete.id);
      if (!result.success) {
        toast.error(result.message ?? "删除对话失败");
        return;
      }

      setPendingDelete(null);
      updateConversationList((prev) =>
        prev.filter((item) => item.id !== pendingDelete.id)
      );
      if (currentConversation?.id === pendingDelete.id) {
        router.push("/chat");
        setCurrentConversation(null);
      }
      setMobileView("list");
    });
  };

  const handleDeleteUnstarredConversations = () => {
    if (!hasDeletable) {
      return;
    }

    startTransition(async () => {
      const result = await deleteUnstarredConversations();
      if (!result.success) {
        toast.error(result.message ?? "批量删除失败");
        return;
      }

      setBulkDeleteOpen(false);
      if (result.deletedCount === 0) {
        toast.message("没有可删除的未收藏对话");
      } else {
        toast.success(`已删除 ${result.deletedCount} 个未收藏对话`);
      }

      updateConversationList((prev) => prev.filter((item) => item.starred));
      if (currentConversation && !currentConversation.starred) {
        router.push("/chat");
        setCurrentConversation(null);
        setMobileView("list");
      }
    });
  };

  const showListOnMobile = mobileView === "list";

  return (
    <div className="flex h-full min-h-0 bg-white dark:bg-[#0a0a0a]">
      <aside
        className={cn(
          "shrink-0 border-r bg-[#f8fafc] p-3 dark:border-zinc-800 dark:bg-[#111315] flex flex-col",
          showListOnMobile ? "w-full" : "hidden",
          isListCollapsed ? "lg:hidden" : "lg:flex lg:w-[300px]"
        )}
      >
        <div className="flex items-center gap-2">
          <Button
            type="button"
            className="h-9 flex-1 justify-start bg-[#2f6df6] hover:bg-[#265fdb]"
            onClick={handleCreateConversation}
            disabled={isMutating}
          >
            <Plus className="size-4" />
            New Chat
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 bg-white dark:bg-[#1a1d21]"
            disabled={isMutating || !hasDeletable}
            onClick={() => {
              setBulkDeleteOpen(true);
            }}
            aria-label="删除未收藏对话"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-auto">
          {conversationList.length === 0 ? (
            <div className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
              暂无对话，点击上方按钮开始。
            </div>
          ) : (
            conversationList.map((chat) => {
              const isActive = currentConversation?.id === chat.id;
              return (
                <div
                  key={chat.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectConversation(chat.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSelectConversation(chat.id);
                    }
                  }}
                  className={cn(
                    "group flex w-full cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors",
                    isActive
                      ? "bg-[#e9eff7] dark:bg-[#1f2b3d]"
                      : "hover:bg-muted dark:hover:bg-zinc-800"
                  )}
                >
                  <MessageSquare className="mt-0.5 size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground/90 dark:text-zinc-100">
                      {chat.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(chat.createdAt)}
                    </span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={chat.starred ? "取消星标" : "设为星标"}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleStar(chat.id);
                      }}
                      className="rounded p-1 text-muted-foreground transition hover:bg-white/60 dark:hover:bg-[#1a1d21]"
                    >
                      <Star
                        className={cn(
                          "size-3.5",
                          chat.starred
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="更多操作"
                          onClick={(event) => event.stopPropagation()}
                          className={cn(
                            "rounded p-1 text-muted-foreground transition hover:bg-white/60 dark:hover:bg-[#1a1d21]",
                            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}
                        >
                          <Ellipsis className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault();
                            setRenamingConversation(chat);
                            setRenameValue(chat.title);
                          }}
                        >
                          重命名
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={(event) => {
                            event.preventDefault();
                            setPendingDelete(chat);
                          }}
                        >
                          删除对话
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <section
        className={cn(
          "flex min-w-0 min-h-0 flex-1 flex-col",
          showListOnMobile ? "hidden" : "flex",
          "lg:flex"
        )}
      >
        {currentConversation ? (
          <ChatThread
            key={conversationKey}
            conversationId={currentConversation.id}
            title={currentConversation.title}
            initialMessages={initialMessages}
            settings={settings}
            isListCollapsed={isListCollapsed}
            onToggleList={() => setIsListCollapsed((prev) => !prev)}
            onBackToList={() => setMobileView("list")}
            onTitleUpdate={(conversationId, title) => {
              updateConversationList((prev) =>
                prev.map((item) =>
                  item.id === conversationId ? { ...item, title } : item
                )
              );
              if (currentConversation?.id === conversationId) {
                setCurrentConversation((prev) =>
                  prev ? { ...prev, title } : prev
                );
              }
            }}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="size-8 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground/90">
              Select a chat
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              选择已有对话，或点击左侧 New Chat 开始新的交流。
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:hidden">
              <Button type="button" onClick={handleCreateConversation} disabled={isMutating}>
                <Plus className="size-4" />
                New Chat
              </Button>
            </div>
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(renamingConversation)}
        onOpenChange={(open) => {
          if (!open) {
            setRenamingConversation(null);
            setRenameValue("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名对话</DialogTitle>
            <DialogDescription>请输入新的对话标题。</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="对话标题"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRenamingConversation(null);
                setRenameValue("");
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleRenameSubmit}
              disabled={isMutating || !renameValue.trim()}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除未收藏对话</DialogTitle>
            <DialogDescription>
              将删除全部未收藏对话及其消息记录，星标对话会保留。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBulkDeleteOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteUnstarredConversations}
              disabled={isMutating || !hasDeletable}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除对话</DialogTitle>
            <DialogDescription>
              删除后将无法恢复，并会移除该对话的全部消息。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              取消
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConversation}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
