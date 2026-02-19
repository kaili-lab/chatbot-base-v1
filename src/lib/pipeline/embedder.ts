import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { eq } from "drizzle-orm";

import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

const DEFAULT_EMBEDDING_BATCH_SIZE = 20;

export async function generateEmbeddings(
  userId: string,
  values: string[]
): Promise<number[][]> {
  if (values.length === 0) {
    return [];
  }

  const userSettings = await db.query.settings.findFirst({
    where: eq(settings.userId, userId),
    columns: {
      llmBaseUrl: true,
      llmApiKey: true,
      embeddingModel: true,
    },
  });

  if (!userSettings?.llmBaseUrl || !userSettings.llmApiKey || !userSettings.embeddingModel) {
    throw new Error("请先在设置中配置 LLM API");
  }

  const openai = createOpenAI({
    baseURL: userSettings.llmBaseUrl,
    apiKey: decrypt(userSettings.llmApiKey),
  });

  const vectors: number[][] = [];

  // 这里按批次调用 Embedding，避免一次提交过大文本导致第三方接口拒绝请求
  for (let index = 0; index < values.length; index += DEFAULT_EMBEDDING_BATCH_SIZE) {
    const batch = values.slice(index, index + DEFAULT_EMBEDDING_BATCH_SIZE);
    const result = await embedMany({
      model: openai.textEmbeddingModel(userSettings.embeddingModel),
      values: batch,
    });

    vectors.push(...result.embeddings);
  }

  return vectors;
}
