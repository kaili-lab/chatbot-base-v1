import { streamText, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import type { UIMessage } from "ai";
import type { MessageSource } from "@/lib/chat/types";
import { auth } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { conversations, messages, settings } from "@/lib/db/schema";
import { retrieveRelevantChunks } from "@/lib/rag/retriever";
import { conversationIdSchema, messageContentSchema } from "@/lib/validations/chat";

const TITLE_MAX_LENGTH = 50;

async function getCurrentUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

function extractLatestUserText(requestMessages: UIMessage[]) {
  for (let index = requestMessages.length - 1; index >= 0; index -= 1) {
    const message = requestMessages[index];
    if (message?.role !== "user") {
      continue;
    }

    const content = message.parts
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("")
      .trim();

    if (content) {
      return content;
    }
  }

  return null;
}

function buildSystemPrompt(chunks: Awaited<ReturnType<typeof retrieveRelevantChunks>>) {
  const header =
    "你是一个知识库助手。请基于以下参考资料回答用户问题，如果参考资料不足以回答，请明确说明。";

  const body = chunks
    .map(
      (chunk, index) =>
        `(${index + 1}) ${chunk.fileName}\n${chunk.content}`
    )
    .join("\n\n");

  return `${header}\n\n${body}`.trim();
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: "未登录" }), { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "请求体解析失败" }), { status: 400 });
  }

  const body = payload as {
    messages?: UIMessage[];
    conversationId?: string;
    chatId?: string;
    id?: string;
  };

  const rawConversationId = body.conversationId ?? body.chatId ?? body.id ?? "";
  const parsedConversationId = conversationIdSchema.safeParse(rawConversationId);
  if (!parsedConversationId.success) {
    return new Response(JSON.stringify({ error: "对话 ID 不合法" }), { status: 400 });
  }

  const requestMessages = body.messages;
  if (!Array.isArray(requestMessages) || requestMessages.length === 0) {
    return new Response(JSON.stringify({ error: "消息内容为空" }), { status: 400 });
  }

  const conversation = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, parsedConversationId.data),
      eq(conversations.userId, userId)
    ),
    columns: {
      id: true,
      title: true,
    },
  });

  if (!conversation) {
    return new Response(JSON.stringify({ error: "对话不存在或无权限" }), {
      status: 404,
    });
  }

  const latestUserText = extractLatestUserText(requestMessages);
  if (!latestUserText) {
    return new Response(JSON.stringify({ error: "消息内容不能为空" }), { status: 400 });
  }

  const parsedContent = messageContentSchema.safeParse(latestUserText);
  if (!parsedContent.success) {
    return new Response(JSON.stringify({ error: parsedContent.error.issues[0]?.message }), {
      status: 400,
    });
  }

  const userSettings = await db.query.settings.findFirst({
    where: eq(settings.userId, userId),
    columns: {
      llmBaseUrl: true,
      llmApiKey: true,
      llmModel: true,
    },
  });

  if (
    !userSettings?.llmBaseUrl ||
    !userSettings.llmApiKey ||
    !userSettings.llmModel
  ) {
    return new Response(
      JSON.stringify({ error: "请先在设置中配置 LLM API" }),
      { status: 400 }
    );
  }

  const existingMessage = await db.query.messages.findFirst({
    where: eq(messages.conversationId, conversation.id),
    columns: {
      id: true,
    },
  });

  const now = new Date();
  const shouldUpdateTitle = !existingMessage;
  const nextTitle = shouldUpdateTitle
    ? parsedContent.data.slice(0, TITLE_MAX_LENGTH).trim()
    : null;

  await db.transaction(async (tx) => {
    await tx.insert(messages).values({
      conversationId: conversation.id,
      role: "user",
      content: parsedContent.data,
      createdAt: now,
      updatedAt: now,
    });

    await tx
      .update(conversations)
      .set({
        updatedAt: now,
        ...(nextTitle ? { title: nextTitle } : {}),
      })
      .where(and(eq(conversations.id, conversation.id), eq(conversations.userId, userId)));
  });

  const provider = createOpenAI({
    apiKey: decrypt(userSettings.llmApiKey),
    baseURL: userSettings.llmBaseUrl,
  });

  let sources: MessageSource = { type: "general" };
  let systemPrompt: string | undefined;

  try {
    const chunks = await retrieveRelevantChunks(parsedContent.data, userId);
    if (chunks.length > 0) {
      sources = { type: "knowledge_base", chunks };
      systemPrompt = buildSystemPrompt(chunks);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "知识库检索失败";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }

  const modelMessages = await convertToModelMessages(requestMessages);

  let result;
  try {
    result = streamText({
      model: provider(userSettings.llmModel),
      system: systemPrompt,
      messages: modelMessages,
      onFinish: async (event) => {
        const assistantText = event.text?.trim() ?? "";
        const timestamp = new Date();

        await db.transaction(async (tx) => {
          await tx.insert(messages).values({
            conversationId: conversation.id,
            role: "assistant",
            content: assistantText,
            sources,
            createdAt: timestamp,
            updatedAt: timestamp,
          });

          await tx
            .update(conversations)
            .set({ updatedAt: timestamp })
            .where(
              and(
                eq(conversations.id, conversation.id),
                eq(conversations.userId, userId)
              )
            );
        });
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "LLM 调用失败";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }

  return result.toUIMessageStreamResponse({
    originalMessages: requestMessages,
  });
}
