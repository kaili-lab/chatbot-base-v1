import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type {
  ChatConversationSummary,
  ChatMessageRecord,
  ChatSettingsSummary,
  MessageSource,
} from "@/lib/chat/types";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, messages, settings } from "@/lib/db/schema";

export async function requireChatUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

export async function getChatConversations(
  userId: string
): Promise<ChatConversationSummary[]> {
  const rows = await db.query.conversations.findMany({
    where: eq(conversations.userId, userId),
    columns: {
      id: true,
      title: true,
      starred: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [desc(conversations.starred), desc(conversations.updatedAt)],
  });

  const mapped = rows.map((row) => ({
    id: row.id,
    title: row.title,
    starred: row.starred,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  return mapped.sort((a, b) => {
    if (a.starred !== b.starred) {
      return a.starred ? -1 : 1;
    }

    const timeA = new Date(a.updatedAt).getTime();
    const timeB = new Date(b.updatedAt).getTime();
    return timeB - timeA;
  });
}

export async function getChatSettingsSummary(
  userId: string
): Promise<ChatSettingsSummary> {
  const row = await db.query.settings.findFirst({
    where: eq(settings.userId, userId),
    columns: {
      llmBaseUrl: true,
      llmApiKey: true,
      llmModel: true,
      embeddingModel: true,
    },
  });

  const hasLlm = Boolean(row?.llmBaseUrl && row?.llmApiKey && row?.llmModel);
  const embeddingReady = Boolean(row?.embeddingModel);

  return {
    hasLlm,
    model: row?.llmModel ?? "",
    embeddingReady,
  };
}

export async function getChatConversationData(
  userId: string,
  conversationId: string | null
): Promise<{
  conversation: ChatConversationSummary | null;
  messages: ChatMessageRecord[];
  lastMessageAt: string | null;
}> {
  if (!conversationId) {
    return { conversation: null, messages: [], lastMessageAt: null };
  }

  const conversation = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, conversationId), eq(conversations.userId, userId)),
    columns: {
      id: true,
      title: true,
      starred: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!conversation) {
    return { conversation: null, messages: [], lastMessageAt: null };
  }

  const messageRows = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversation.id),
    orderBy: [asc(messages.createdAt)],
  });

  const formattedMessages = messageRows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    sources: (row.sources ?? null) as MessageSource | null,
    createdAt: row.createdAt.toISOString(),
  }));

  const lastMessageAt =
    messageRows.length > 0
      ? (messageRows[messageRows.length - 1]?.updatedAt ?? messageRows[messageRows.length - 1]?.createdAt)
          ?.toISOString() ?? null
      : null;

  return {
    conversation: {
      id: conversation.id,
      title: conversation.title,
      starred: conversation.starred,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    },
    messages: formattedMessages,
    lastMessageAt,
  };
}
