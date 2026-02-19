"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents, embeddings, folders } from "@/lib/db/schema";
import { getDocumentTypeByFileName, getParserByFileName } from "@/lib/parsers";
import { processDocument } from "@/lib/pipeline";
import {
  documentFileNameSchema,
  documentIdSchema,
  noteContentSchema,
  noteTitleSchema,
} from "@/lib/validations/document";
import { folderIdSchema, folderNameSchema } from "@/lib/validations/folder";

type FolderRecord = {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DocumentRecord = {
  id: string;
  userId: string;
  folderId: string | null;
  fileName: string;
  fileType: "md" | "txt";
  fileSize: number;
  content: string;
  isNote: boolean;
  status: "uploading" | "processing" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
};

type FolderActionResult = {
  success: boolean;
  message?: string;
  folder?: FolderRecord;
  deletedIds?: string[];
  deletedDocumentCount?: number;
};

type DocumentActionResult = {
  success: boolean;
  message?: string;
  document?: DocumentRecord;
};

type UploadDocumentsResult = {
  success: boolean;
  message?: string;
  uploadedCount?: number;
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

async function ensureOwnedFolder(userId: string, folderId: string) {
  const folder = await db.query.folders.findFirst({
    where: and(eq(folders.id, folderId), eq(folders.userId, userId)),
  });

  if (!folder) {
    throw new Error("父文件夹不存在或无权限");
  }

  return folder;
}

function collectDescendantFolderIds(
  allFolders: Array<Pick<FolderRecord, "id" | "parentId">>,
  rootId: string
) {
  const parentMap = new Map<string, string[]>();

  for (const folder of allFolders) {
    if (!folder.parentId) {
      continue;
    }

    const children = parentMap.get(folder.parentId) ?? [];
    children.push(folder.id);
    parentMap.set(folder.parentId, children);
  }

  const queue = [rootId];
  const idsToDelete: string[] = [];

  // 先展开整个子树再删除，能避免边删边查导致的遗漏问题
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }

    idsToDelete.push(currentId);

    const children = parentMap.get(currentId) ?? [];
    for (const childId of children) {
      queue.push(childId);
    }
  }

  return idsToDelete;
}

function extractExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

function normalizeDocumentFileName(rawName: string, target: DocumentRecord) {
  const normalizedName = rawName.trim();
  const currentExtension = extractExtension(target.fileName);
  const nextExtension = extractExtension(normalizedName);

  // 统一把“重命名”约束在文件名层，不允许在这里变更文件类型，避免 fileName 与 fileType 脱节。
  if (target.isNote) {
    if (nextExtension && nextExtension !== "md") {
      return {
        success: false as const,
        message: "笔记文件只能使用 .md 后缀",
      };
    }

    const nextBaseName = nextExtension
      ? normalizedName.slice(0, normalizedName.lastIndexOf(".")).trim()
      : normalizedName;
    if (!nextBaseName) {
      return {
        success: false as const,
        message: "文件名不能为空",
      };
    }

    return {
      success: true as const,
      fileName: `${nextBaseName}.md`,
    };
  }

  if (!currentExtension) {
    return {
      success: true as const,
      fileName: normalizedName,
    };
  }

  if (!nextExtension) {
    return {
      success: true as const,
      fileName: `${normalizedName}.${currentExtension}`,
    };
  }

  if (nextExtension !== currentExtension) {
    return {
      success: false as const,
      message: `文件后缀必须保持为 .${currentExtension}`,
    };
  }

  return {
    success: true as const,
    fileName: normalizedName,
  };
}

export async function createFolder(
  name: string,
  parentId?: string | null
): Promise<FolderActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  const parsedName = folderNameSchema.safeParse(name);
  if (!parsedName.success) {
    return {
      success: false,
      message: parsedName.error.issues[0]?.message ?? "文件夹名称不合法",
    };
  }

  let safeParentId: string | null = null;
  if (parentId) {
    const parsedParentId = folderIdSchema.safeParse(parentId);
    if (!parsedParentId.success) {
      return {
        success: false,
        message: parsedParentId.error.issues[0]?.message ?? "父文件夹 ID 不合法",
      };
    }

    try {
      const ownedParent = await ensureOwnedFolder(userId, parsedParentId.data);
      safeParentId = ownedParent.id;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "父文件夹不存在或无权限",
      };
    }
  }

  const insertedFolders = await db
    .insert(folders)
    .values({
      userId,
      name: parsedName.data,
      parentId: safeParentId,
      updatedAt: new Date(),
    })
    .returning();

  const insertedFolder = insertedFolders[0];
  revalidatePath("/documents");

  return {
    success: true,
    folder: insertedFolder,
  };
}

export async function renameFolder(
  id: string,
  newName: string
): Promise<FolderActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  const parsedId = folderIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      message: parsedId.error.issues[0]?.message ?? "文件夹 ID 不合法",
    };
  }

  const parsedName = folderNameSchema.safeParse(newName);
  if (!parsedName.success) {
    return {
      success: false,
      message: parsedName.error.issues[0]?.message ?? "文件夹名称不合法",
    };
  }

  const updatedFolders = await db
    .update(folders)
    .set({
      name: parsedName.data,
      updatedAt: new Date(),
    })
    .where(and(eq(folders.id, parsedId.data), eq(folders.userId, userId)))
    .returning();

  const updatedFolder = updatedFolders[0];
  if (!updatedFolder) {
    return {
      success: false,
      message: "文件夹不存在或无权限",
    };
  }

  revalidatePath("/documents");

  return {
    success: true,
    folder: updatedFolder,
  };
}

export async function uploadDocuments(
  formData: FormData
): Promise<UploadDocumentsResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  const rawFolderId = formData.get("folderId");
  const folderId =
    typeof rawFolderId === "string" && rawFolderId.trim() !== ""
      ? rawFolderId
      : null;

  if (folderId) {
    const parsedFolderId = folderIdSchema.safeParse(folderId);
    if (!parsedFolderId.success) {
      return {
        success: false,
        message: parsedFolderId.error.issues[0]?.message ?? "父文件夹 ID 不合法",
      };
    }

    try {
      await ensureOwnedFolder(userId, parsedFolderId.data);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "父文件夹不存在或无权限",
      };
    }
  }

  const files = formData
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (files.length === 0) {
    return {
      success: false,
      message: "请先选择要上传的文件",
    };
  }

  let uploadedCount = 0;

  for (const file of files) {
    const fileType = getDocumentTypeByFileName(file.name);
    if (!fileType) {
      return {
        success: false,
        message: `不支持的文件格式：${file.name}`,
      };
    }

    const insertedDocuments = await db
      .insert(documents)
      .values({
        userId,
        folderId,
        fileName: file.name,
        fileType,
        fileSize: 0,
        content: "",
        isNote: false,
        status: "processing",
        updatedAt: new Date(),
      })
      .returning();

    const insertedDocument = insertedDocuments[0];

    try {
      const parser = getParserByFileName(file.name);
      const rawContent = await file.text();
      const parsedContent = await parser.parse(rawContent, file.name);
      const fileSize = Buffer.byteLength(parsedContent, "utf8");

      await db
        .update(documents)
        .set({
          content: parsedContent,
          fileSize,
          status: "processing",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(documents.id, insertedDocument.id),
            eq(documents.userId, userId)
          )
        );

      await processDocument(insertedDocument.id, userId);
      uploadedCount += 1;
    } catch {
      await db
        .update(documents)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(documents.id, insertedDocument.id),
            eq(documents.userId, userId)
          )
        );
    }
  }

  revalidatePath("/documents");

  if (uploadedCount === 0) {
    return {
      success: false,
      message: "文件解析失败，请检查 LLM 设置后重试",
    };
  }

  return {
    success: true,
    uploadedCount,
    message: `已上传 ${uploadedCount} 个文件`,
  };
}

export async function createNote(
  title: string,
  folderId?: string | null
): Promise<DocumentActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  const parsedTitle = noteTitleSchema.safeParse(title);
  if (!parsedTitle.success) {
    return {
      success: false,
      message: parsedTitle.error.issues[0]?.message ?? "笔记标题不合法",
    };
  }

  let safeFolderId: string | null = null;
  if (folderId) {
    const parsedFolderId = folderIdSchema.safeParse(folderId);
    if (!parsedFolderId.success) {
      return {
        success: false,
        message: parsedFolderId.error.issues[0]?.message ?? "父文件夹 ID 不合法",
      };
    }

    try {
      const ownedFolder = await ensureOwnedFolder(userId, parsedFolderId.data);
      safeFolderId = ownedFolder.id;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "父文件夹不存在或无权限",
      };
    }
  }

  const fileName = `${parsedTitle.data}.md`;
  const content = `# ${parsedTitle.data}\n\n`;

  const insertedDocuments = await db
    .insert(documents)
    .values({
      userId,
      folderId: safeFolderId,
      fileName,
      fileType: "md",
      fileSize: Buffer.byteLength(content, "utf8"),
      content,
      isNote: true,
      status: "completed",
      updatedAt: new Date(),
    })
    .returning();

  const insertedDocument = insertedDocuments[0];

  revalidatePath("/documents");

  return {
    success: true,
    document: insertedDocument,
  };
}

export async function renameDocument(
  id: string,
  newName: string
): Promise<DocumentActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  const parsedId = documentIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      message: parsedId.error.issues[0]?.message ?? "文档 ID 非法",
    };
  }

  const parsedName = documentFileNameSchema.safeParse(newName);
  if (!parsedName.success) {
    return {
      success: false,
      message: parsedName.error.issues[0]?.message ?? "文件名不合法",
    };
  }

  const targetDocument = await db.query.documents.findFirst({
    where: and(eq(documents.id, parsedId.data), eq(documents.userId, userId)),
  });

  if (!targetDocument) {
    return {
      success: false,
      message: "文件不存在或无权限",
    };
  }

  const normalizedResult = normalizeDocumentFileName(parsedName.data, targetDocument);
  if (!normalizedResult.success) {
    return {
      success: false,
      message: normalizedResult.message,
    };
  }

  const updatedDocuments = await db
    .update(documents)
    .set({
      fileName: normalizedResult.fileName,
      updatedAt: new Date(),
    })
    .where(and(eq(documents.id, targetDocument.id), eq(documents.userId, userId)))
    .returning();

  const updatedDocument = updatedDocuments[0];
  if (!updatedDocument) {
    return {
      success: false,
      message: "文件不存在或无权限",
    };
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${updatedDocument.id}`);
  if (updatedDocument.isNote) {
    revalidatePath(`/documents/${updatedDocument.id}/edit`);
  }

  return {
    success: true,
    document: updatedDocument,
  };
}

export async function updateNoteContent(
  documentId: string,
  content: string
): Promise<DocumentActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  const parsedDocumentId = documentIdSchema.safeParse(documentId);
  if (!parsedDocumentId.success) {
    return {
      success: false,
      message: parsedDocumentId.error.issues[0]?.message ?? "文档 ID 非法",
    };
  }

  const parsedContent = noteContentSchema.safeParse(content);
  if (!parsedContent.success) {
    return {
      success: false,
      message: parsedContent.error.issues[0]?.message ?? "笔记内容不合法",
    };
  }

  const targetDocument = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, parsedDocumentId.data),
      eq(documents.userId, userId),
      eq(documents.isNote, true)
    ),
  });

  if (!targetDocument) {
    return {
      success: false,
      message: "笔记不存在或无权限",
    };
  }

  const fileSize = Buffer.byteLength(parsedContent.data, "utf8");

  const updatedDocuments = await db
    .update(documents)
    .set({
      content: parsedContent.data,
      fileSize,
      status: "processing",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(documents.id, targetDocument.id),
        eq(documents.userId, userId),
        eq(documents.isNote, true)
      )
    )
    .returning();

  try {
    await processDocument(targetDocument.id, userId);
  } catch {
    return {
      success: false,
      message: "笔记已保存，但向量化失败，请检查 LLM 设置",
      document: updatedDocuments[0],
    };
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${targetDocument.id}`);

  return {
    success: true,
    document: updatedDocuments[0],
  };
}

export async function deleteDocument(
  id: string
): Promise<DocumentActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  const parsedId = documentIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      message: parsedId.error.issues[0]?.message ?? "文档 ID 非法",
    };
  }

  const targetDocument = await db.query.documents.findFirst({
    where: and(eq(documents.id, parsedId.data), eq(documents.userId, userId)),
  });

  if (!targetDocument) {
    return {
      success: false,
      message: "文件不存在或无权限",
    };
  }

  await db.delete(embeddings).where(eq(embeddings.documentId, targetDocument.id));

  await db
    .delete(documents)
    .where(and(eq(documents.id, targetDocument.id), eq(documents.userId, userId)));

  revalidatePath("/documents");

  return {
    success: true,
    document: targetDocument,
  };
}

export async function deleteFolder(id: string): Promise<FolderActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  const parsedId = folderIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      message: parsedId.error.issues[0]?.message ?? "文件夹 ID 不合法",
    };
  }

  const userFolders = await db.query.folders.findMany({
    where: eq(folders.userId, userId),
    columns: {
      id: true,
      parentId: true,
    },
  });

  const targetExists = userFolders.some((folder) => folder.id === parsedId.data);
  if (!targetExists) {
    return {
      success: false,
      message: "文件夹不存在或无权限",
    };
  }

  const idsToDelete = collectDescendantFolderIds(userFolders, parsedId.data);

  const documentsInFolders = await db.query.documents.findMany({
    where: and(eq(documents.userId, userId), inArray(documents.folderId, idsToDelete)),
    columns: {
      id: true,
    },
  });

  const documentIds = documentsInFolders.map((item) => item.id);

  if (documentIds.length > 0) {
    await db
      .delete(embeddings)
      .where(and(eq(embeddings.userId, userId), inArray(embeddings.documentId, documentIds)));

    await db
      .delete(documents)
      .where(and(eq(documents.userId, userId), inArray(documents.id, documentIds)));
  }

  await db
    .delete(folders)
    .where(and(eq(folders.userId, userId), inArray(folders.id, idsToDelete)));

  revalidatePath("/documents");

  return {
    success: true,
    deletedIds: idsToDelete,
    deletedDocumentCount: documentIds.length,
  };
}
