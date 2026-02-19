"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { folderIdSchema, folderNameSchema } from "@/lib/validations/folder";

type FolderRecord = {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type FolderActionResult = {
  success: boolean;
  message?: string;
  folder?: FolderRecord;
  deletedIds?: string[];
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

  // 先在内存里一次性算出整棵子树，避免递归触发多次数据库往返
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

    const parentFolder = await db.query.folders.findFirst({
      where: and(eq(folders.id, parsedParentId.data), eq(folders.userId, userId)),
    });

    if (!parentFolder) {
      return {
        success: false,
        message: "父文件夹不存在或无权限",
      };
    }

    safeParentId = parentFolder.id;
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

  await db
    .delete(folders)
    .where(and(eq(folders.userId, userId), inArray(folders.id, idsToDelete)));

  revalidatePath("/documents");

  return {
    success: true,
    deletedIds: idsToDelete,
  };
}
