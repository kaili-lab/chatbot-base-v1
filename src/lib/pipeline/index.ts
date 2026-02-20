import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { documents, embeddings } from "@/lib/db/schema";

import { splitTextIntoChunks } from "./chunker";
import { generateEmbeddings } from "./embedder";

type ProcessDocumentResult = {
  chunkCount: number;
};

type ProcessDocumentOptions = {
  content?: string;
  fileSize?: number;
  markFailedOnError?: boolean;
};

export async function processDocument(
  documentId: string,
  userId: string,
  options: ProcessDocumentOptions = {}
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

  const content = options.content ?? targetDocument.content;
  const shouldUpdateContent = options.content !== undefined;
  const fileSize =
    options.fileSize ?? (shouldUpdateContent ? Buffer.byteLength(content, "utf8") : undefined);

  try {
    const chunks = splitTextIntoChunks(content);
    const vectors =
      chunks.length > 0
        ? await generateEmbeddings(
            userId,
            chunks.map((chunk) => chunk.content)
          )
        : [];

    if (vectors.length !== chunks.length) {
      throw new Error("向量化结果数量与文本分块数量不一致");
    }

    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.delete(embeddings).where(eq(embeddings.documentId, documentId));

      if (chunks.length > 0) {
        await tx.insert(embeddings).values(
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

      const updateData = {
        status: "completed" as const,
        updatedAt: now,
        ...(shouldUpdateContent ? { content, fileSize } : {}),
      };

      await tx
        .update(documents)
        .set(updateData)
        .where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
    });

    return {
      chunkCount: chunks.length,
    };
  } catch (error) {
    if (options.markFailedOnError !== false) {
      await db
        .update(documents)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
    }

    throw error;
  }
}
