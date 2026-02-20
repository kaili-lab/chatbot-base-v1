"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import type { MessageSource } from "@/lib/chat/types";
import { conversationIdSchema, conversationTitleSchema } from "@/lib/validations/chat";

type ConversationRecord = {
  id: string;
  userId: string;
  title: string;
  starred: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ConversationActionResult = {
  success: boolean;
  message?: string;
  conversation?: ConversationRecord;
};

type BulkDeleteActionResult = {
  success: boolean;
  message?: string;
  deletedCount: number;
};

type SourcesActionResult = {
  success: boolean;
  message?: string;
  sources: MessageSource | null;
};

async function getCurrentUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

export async function createConversation(): Promise<ConversationActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  try {
    const insertedRows = await db
      .insert(conversations)
      .values({
        userId,
        title: "New Chat",
        starred: false,
        updatedAt: new Date(),
      })
      .returning();

    const insertedConversation = insertedRows[0];
    if (!insertedConversation) {
      return {
        success: false,
        message: "创建对话失败，请稍后重试",
      };
    }
    revalidatePath("/chat");

    return {
      success: true,
      conversation: insertedConversation,
    };
  } catch {
    return {
      success: false,
      message: "创建对话失败，请稍后重试",
    };
  }
}

export async function renameConversation(
  conversationId: string,
  newTitle: string
): Promise<ConversationActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  const parsedId = conversationIdSchema.safeParse(conversationId);
  if (!parsedId.success) {
    return {
      success: false,
      message: parsedId.error.issues[0]?.message ?? "对话 ID 不合法",
    };
  }

  const parsedTitle = conversationTitleSchema.safeParse(newTitle);
  if (!parsedTitle.success) {
    return {
      success: false,
      message: parsedTitle.error.issues[0]?.message ?? "对话标题不合法",
    };
  }

  try {
    const updatedRows = await db
      .update(conversations)
      .set({
        title: parsedTitle.data,
        updatedAt: new Date(),
      })
      .where(and(eq(conversations.id, parsedId.data), eq(conversations.userId, userId)))
      .returning();

    const updatedConversation = updatedRows[0];
    if (!updatedConversation) {
      return {
        success: false,
        message: "对话不存在或无权限",
      };
    }

    revalidatePath("/chat");

    return {
      success: true,
      conversation: updatedConversation,
    };
  } catch {
    return {
      success: false,
      message: "重命名失败，请稍后重试",
    };
  }
}

export async function toggleStar(
  conversationId: string
): Promise<ConversationActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  const parsedId = conversationIdSchema.safeParse(conversationId);
  if (!parsedId.success) {
    return {
      success: false,
      message: parsedId.error.issues[0]?.message ?? "对话 ID 不合法",
    };
  }

  try {
    const targetConversation = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, parsedId.data), eq(conversations.userId, userId)),
    });

    if (!targetConversation) {
      return {
        success: false,
        message: "对话不存在或无权限",
      };
    }

    const updatedRows = await db
      .update(conversations)
      .set({
        starred: !targetConversation.starred,
        updatedAt: new Date(),
      })
      .where(and(eq(conversations.id, parsedId.data), eq(conversations.userId, userId)))
      .returning();

    const updatedConversation = updatedRows[0];
    if (!updatedConversation) {
      return {
        success: false,
        message: "对话更新失败，请稍后重试",
      };
    }

    revalidatePath("/chat");

    return {
      success: true,
      conversation: updatedConversation,
    };
  } catch {
    return {
      success: false,
      message: "星标更新失败，请稍后重试",
    };
  }
}

export async function deleteConversation(
  conversationId: string
): Promise<ConversationActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  const parsedId = conversationIdSchema.safeParse(conversationId);
  if (!parsedId.success) {
    return {
      success: false,
      message: parsedId.error.issues[0]?.message ?? "对话 ID 不合法",
    };
  }

  try {
    const deletedRows = await db
      .delete(conversations)
      .where(and(eq(conversations.id, parsedId.data), eq(conversations.userId, userId)))
      .returning();

    const deletedConversation = deletedRows[0];
    if (!deletedConversation) {
      return {
        success: false,
        message: "对话不存在或无权限",
      };
    }

    revalidatePath("/chat");

    return {
      success: true,
      conversation: deletedConversation,
    };
  } catch {
    return {
      success: false,
      message: "删除对话失败，请稍后重试",
    };
  }
}

export async function deleteUnstarredConversations(): Promise<BulkDeleteActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
      deletedCount: 0,
    };
  }

  try {
    const deletedRows = await db
      .delete(conversations)
      .where(and(eq(conversations.userId, userId), eq(conversations.starred, false)))
      .returning({ id: conversations.id });

    revalidatePath("/chat");

    return {
      success: true,
      deletedCount: deletedRows.length,
    };
  } catch {
    return {
      success: false,
      message: "批量删除对话失败，请稍后重试",
      deletedCount: 0,
    };
  }
}

export async function getLatestAssistantSources(
  conversationId: string
): Promise<SourcesActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
      sources: null,
    };
  }

  const parsedId = conversationIdSchema.safeParse(conversationId);
  if (!parsedId.success) {
    return {
      success: false,
      message: parsedId.error.issues[0]?.message ?? "对话 ID 不合法",
      sources: null,
    };
  }

  const conversation = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, parsedId.data), eq(conversations.userId, userId)),
    columns: {
      id: true,
    },
  });

  if (!conversation) {
    return {
      success: false,
      message: "对话不存在或无权限",
      sources: null,
    };
  }

  const latestAssistant = await db.query.messages.findFirst({
    where: and(
      eq(messages.conversationId, conversation.id),
      eq(messages.role, "assistant")
    ),
    orderBy: [desc(messages.createdAt)],
    columns: {
      sources: true,
    },
  });

  return {
    success: true,
    sources: (latestAssistant?.sources ?? null) as MessageSource | null,
  };
}
