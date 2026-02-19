import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents, embeddings, folders } from "@/lib/db/schema";

export async function requireDocumentsUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

export async function getDocumentsWorkspaceData(userId: string) {
  const [folderRows, documentRows] = await Promise.all([
    db.query.folders.findMany({
      where: eq(folders.userId, userId),
      columns: {
        id: true,
        name: true,
        parentId: true,
      },
      orderBy: [asc(folders.createdAt)],
    }),
    db.query.documents.findMany({
      where: eq(documents.userId, userId),
      columns: {
        id: true,
        folderId: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        isNote: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [asc(documents.createdAt)],
    }),
  ]);

  return {
    folders: folderRows,
    documents: documentRows,
  };
}

export async function getDocumentDetailById(documentId: string, userId: string) {
  const targetDocument = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), eq(documents.userId, userId)),
  });

  if (!targetDocument) {
    notFound();
  }

  const chunkCountResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(embeddings)
    .where(eq(embeddings.documentId, targetDocument.id));

  return {
    ...targetDocument,
    chunkCount: chunkCountResult[0]?.count ?? 0,
  };
}
