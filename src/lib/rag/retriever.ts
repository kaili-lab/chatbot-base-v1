import { and, eq, sql } from "drizzle-orm";

import type { KnowledgeBaseChunk } from "@/lib/chat/types";
import { db } from "@/lib/db";
import { documents, embeddings } from "@/lib/db/schema";
import { generateEmbeddings } from "@/lib/pipeline/embedder";

const DEFAULT_TOP_K = 10;
const DEFAULT_THRESHOLD = 0.7;
const RAG_DEBUG = process.env.RAG_DEBUG === "true";
const SHORT_QUERY_THRESHOLD = 0.2;
const MEDIUM_QUERY_THRESHOLD = 0.3;
const LONG_QUERY_THRESHOLD = 0.4;

function resolveSimilarityThreshold(query: string, baseThreshold: number) {
  const length = query.length;
  let targetThreshold = baseThreshold;

  // WHY: 短问题语义密度低，相似度得分普遍偏低，适当降阈值提升召回率。
  if (length <= 6) {
    targetThreshold = SHORT_QUERY_THRESHOLD;
  } else if (length <= 12) {
    targetThreshold = MEDIUM_QUERY_THRESHOLD;
  } else if (length <= 20) {
    targetThreshold = LONG_QUERY_THRESHOLD;
  }

  return Math.min(baseThreshold, targetThreshold);
}

export async function retrieveRelevantChunks(
  query: string,
  userId: string,
  topK: number = DEFAULT_TOP_K,
  threshold: number = DEFAULT_THRESHOLD
): Promise<KnowledgeBaseChunk[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const effectiveThreshold = resolveSimilarityThreshold(trimmedQuery, threshold);
  const [queryVector] = await generateEmbeddings(userId, [trimmedQuery]);
  if (!queryVector) {
    return [];
  }

  // pgvector 对参数类型敏感，这里用显式 vector 字面量确保查询可用
  const vectorSql = sql.raw("ARRAY[" + queryVector.join(",") + "]::vector");
  const similarity = sql<number>`1 - (${embeddings.vector} <=> ${vectorSql})`;

  const rows = await db
    .select({
      documentId: embeddings.documentId,
      content: embeddings.content,
      metadata: embeddings.metadata,
      fileName: documents.fileName,
      similarity,
    })
    .from(embeddings)
    .innerJoin(documents, eq(embeddings.documentId, documents.id))
    .where(and(eq(embeddings.userId, userId), sql`${similarity} >= ${effectiveThreshold}`))
    .orderBy(sql`${embeddings.vector} <=> ${vectorSql}`)
    .limit(topK);

  if (RAG_DEBUG) {
    const hitCount = rows.length;
    if (hitCount === 0) {
      // WHY: 仅在调试模式下查询最高相似度，判断是否因阈值过高导致未命中。
      const topRow = await db
        .select({ similarity })
        .from(embeddings)
        .innerJoin(documents, eq(embeddings.documentId, documents.id))
        .where(eq(embeddings.userId, userId))
        .orderBy(sql`${embeddings.vector} <=> ${vectorSql}`)
        .limit(1);
      const topSimilarity = topRow[0]?.similarity ?? null;
      console.info("[RAG] query", {
        length: trimmedQuery.length,
        topK,
        threshold: effectiveThreshold,
        baseThreshold: threshold,
        hits: hitCount,
        topSimilarity,
      });
    } else {
      console.info("[RAG] query", {
        length: trimmedQuery.length,
        topK,
        threshold: effectiveThreshold,
        baseThreshold: threshold,
        hits: hitCount,
      });
    }
  }

  return rows.map((row) => ({
    documentId: row.documentId,
    fileName: row.fileName,
    content: row.content,
    metadata: row.metadata ?? null,
    similarity: Number(row.similarity ?? 0),
  }));
}
