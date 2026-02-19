import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { documents, embeddings } from "@/lib/db/schema";

import { splitTextIntoChunks } from "./chunker";
import { generateEmbeddings } from "./embedder";

type ProcessDocumentResult = {
  chunkCount: number;
};

export async function processDocument(
  documentId: string,
  userId: string
): Promise<ProcessDocumentResult> {
  const targetDocument = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), eq(documents.userId, userId)),
    columns: {
      id: true,
      content: true,
    },
  });

  if (!targetDocument) {
    throw new Error("文档不存在或无权限");
  }

  try {
    const chunks = splitTextIntoChunks(targetDocument.content);

    await db.delete(embeddings).where(eq(embeddings.documentId, documentId));

    if (chunks.length > 0) {
      const vectors = await generateEmbeddings(
        userId,
        chunks.map((chunk) => chunk.content)
      );

      if (vectors.length !== chunks.length) {
        throw new Error("向量化结果数量与文本分块数量不一致");
      }

      const now = new Date();
      await db.insert(embeddings).values(
        chunks.map((chunk, index) => ({
          documentId,
          userId,
          content: chunk.content,
          vector: vectors[index],
          chunkIndex: chunk.chunkIndex,
          metadata: chunk.metadata,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }

    await db
      .update(documents)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)));

    return {
      chunkCount: chunks.length,
    };
  } catch (error) {
    await db
      .update(documents)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)));

    throw error;
  }
}
