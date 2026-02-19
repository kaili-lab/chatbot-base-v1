// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
const mockHeaders = vi.fn();
const mockRevalidatePath = vi.fn();
const mockProcessDocument = vi.fn();

const mockFolderFindFirst = vi.fn();
const mockFolderFindMany = vi.fn();
const mockDocumentFindFirst = vi.fn();
const mockDocumentFindMany = vi.fn();

const mockInsertReturning = vi.fn();
const mockInsertValues = vi.fn(() => ({
  returning: mockInsertReturning,
}));
const mockInsert = vi.fn(() => ({
  values: mockInsertValues,
}));

const mockUpdateReturning = vi.fn();
const mockUpdateWhere = vi.fn(() => ({
  returning: mockUpdateReturning,
}));
const mockUpdateSet = vi.fn(() => ({
  where: mockUpdateWhere,
}));
const mockUpdate = vi.fn(() => ({
  set: mockUpdateSet,
}));

const mockDeleteWhere = vi.fn();
const mockDelete = vi.fn(() => ({
  where: mockDeleteWhere,
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock("@/lib/pipeline", () => ({
  processDocument: mockProcessDocument,
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      folders: {
        findFirst: mockFolderFindFirst,
        findMany: mockFolderFindMany,
      },
      documents: {
        findFirst: mockDocumentFindFirst,
        findMany: mockDocumentFindMany,
      },
    },
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

const ROOT_ID = "11111111-1111-4111-8111-111111111111";
const CHILD_ID = "22222222-2222-4222-8222-222222222222";
const NOTE_ID = "33333333-3333-4333-8333-333333333333";
const DOC_ID = "44444444-4444-4444-8444-444444444444";
const OTHER_USER_FOLDER = "55555555-5555-4555-8555-555555555555";

describe("documents actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({ user: { id: "user-a" } });

    mockFolderFindFirst.mockResolvedValue(null);
    mockFolderFindMany.mockResolvedValue([]);
    mockDocumentFindFirst.mockResolvedValue(null);
    mockDocumentFindMany.mockResolvedValue([]);

    mockInsertReturning.mockResolvedValue([]);
    mockUpdateReturning.mockResolvedValue([]);
    mockDeleteWhere.mockResolvedValue(undefined);
    mockProcessDocument.mockResolvedValue({ chunkCount: 1 });
  });

  it("createNote 创建笔记记录并写入 isNote/folderId", async () => {
    const { createNote } = await import("./actions");

    mockFolderFindFirst.mockResolvedValueOnce({
      id: ROOT_ID,
      userId: "user-a",
      name: "Root",
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockInsertReturning.mockResolvedValueOnce([
      {
        id: NOTE_ID,
        userId: "user-a",
        folderId: ROOT_ID,
        fileName: "会议纪要.md",
        fileType: "md",
        fileSize: 16,
        content: "# 会议纪要",
        isNote: true,
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await createNote("会议纪要", ROOT_ID);

    expect(result.success).toBe(true);

    const insertArg = mockInsertValues.mock.calls[0]?.[0] as {
      isNote: boolean;
      folderId: string | null;
    };

    expect(insertArg.isNote).toBe(true);
    expect(insertArg.folderId).toBe(ROOT_ID);
  });

  it("updateNoteContent 更新 content/fileSize 并触发 pipeline", async () => {
    const { updateNoteContent } = await import("./actions");

    mockDocumentFindFirst.mockResolvedValueOnce({
      id: NOTE_ID,
      userId: "user-a",
      isNote: true,
      content: "old",
    });

    mockUpdateReturning.mockResolvedValueOnce([
      {
        id: NOTE_ID,
        content: "## 新内容",
        fileSize: 10,
      },
    ]);

    const result = await updateNoteContent(NOTE_ID, "## 新内容");

    expect(result.success).toBe(true);

    const updateArg = mockUpdateSet.mock.calls[0]?.[0] as {
      content: string;
      fileSize: number;
    };

    expect(updateArg.content).toBe("## 新内容");
    expect(updateArg.fileSize).toBeGreaterThan(0);
    expect(mockProcessDocument).toHaveBeenCalledWith(NOTE_ID, "user-a");
  });

  it("uploadDocuments 上传后会写入 documents 并解析内容", async () => {
    const { uploadDocuments } = await import("./actions");

    mockInsertReturning.mockResolvedValueOnce([
      {
        id: DOC_ID,
        userId: "user-a",
        folderId: null,
        fileName: "demo.md",
        fileType: "md",
        fileSize: 0,
        content: "",
        isNote: false,
        status: "processing",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const formData = new FormData();
    formData.append("files", new File(["# 标题\n\n正文"], "demo.md", { type: "text/markdown" }));

    const result = await uploadDocuments(formData);

    expect(result.success).toBe(true);
    expect(result.uploadedCount).toBe(1);

    const updateArg = mockUpdateSet.mock.calls[0]?.[0] as {
      content: string;
      status: string;
    };

    expect(updateArg.content).toContain("# 标题");
    expect(updateArg.status).toBe("processing");
    expect(mockProcessDocument).toHaveBeenCalledWith(DOC_ID, "user-a");
  });

  it("deleteDocument 会删除文档和关联 embeddings", async () => {
    const { deleteDocument } = await import("./actions");

    mockDocumentFindFirst.mockResolvedValueOnce({
      id: DOC_ID,
      userId: "user-a",
      fileName: "demo.txt",
      fileType: "txt",
      fileSize: 10,
      content: "abc",
      folderId: null,
      isNote: false,
      status: "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await deleteDocument(DOC_ID);

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  it("deleteFolder 级联删除子文件夹、文档和 embeddings", async () => {
    const { deleteFolder } = await import("./actions");

    mockFolderFindMany.mockResolvedValueOnce([
      { id: ROOT_ID, parentId: null },
      { id: CHILD_ID, parentId: ROOT_ID },
    ]);

    mockDocumentFindMany.mockResolvedValueOnce([{ id: DOC_ID }]);

    const result = await deleteFolder(ROOT_ID);

    expect(result.success).toBe(true);
    expect(result.deletedIds).toEqual([ROOT_ID, CHILD_ID]);
    expect(result.deletedDocumentCount).toBe(1);
    expect(mockDelete).toHaveBeenCalledTimes(3);
  });

  it("数据隔离：用户 A 不能删除用户 B 的文件夹", async () => {
    const { deleteFolder } = await import("./actions");

    mockFolderFindMany.mockResolvedValueOnce([{ id: ROOT_ID, parentId: null }]);

    const result = await deleteFolder(OTHER_USER_FOLDER);

    expect(result.success).toBe(false);
    expect(result.message).toContain("无权限");
  });
});
