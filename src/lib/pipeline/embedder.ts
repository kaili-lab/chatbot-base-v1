import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { eq } from "drizzle-orm";

import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { DEFAULT_EMBEDDING_DIMENSION, DEFAULT_EMBEDDING_MODEL } from "@/lib/llm/constants";

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

  if (!userSettings?.llmBaseUrl || !userSettings.llmApiKey) {
    throw new Error("请先在设置中配置 LLM API");
  }

  const embeddingModel = userSettings.embeddingModel ?? DEFAULT_EMBEDDING_MODEL;

  const openai = createOpenAI({
    baseURL: userSettings.llmBaseUrl,
    apiKey: decrypt(userSettings.llmApiKey),
  });

  const vectors: number[][] = [];

  // 这里按批次调用 Embedding，避免一次提交过大文本导致第三方接口拒绝请求
  for (let index = 0; index < values.length; index += DEFAULT_EMBEDDING_BATCH_SIZE) {
    const batch = values.slice(index, index + DEFAULT_EMBEDDING_BATCH_SIZE);
    const result = await embedMany({
      model: openai.textEmbeddingModel(embeddingModel),
      values: batch,
    });

    for (const vector of result.embeddings) {
      if (vector.length !== DEFAULT_EMBEDDING_DIMENSION) {
        throw new Error("Embedding 维度不匹配，请确认模型配置");
      }
    }

    vectors.push(...result.embeddings);
  }

  return vectors;
}
