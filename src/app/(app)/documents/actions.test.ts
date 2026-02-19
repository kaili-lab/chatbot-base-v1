// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
const mockHeaders = vi.fn();
const mockFolderFindFirst = vi.fn();
const mockFolderFindMany = vi.fn();

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

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      folders: {
        findFirst: mockFolderFindFirst,
        findMany: mockFolderFindMany,
      },
    },
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const ROOT_ID = "11111111-1111-4111-8111-111111111111";
const CHILD_ID = "22222222-2222-4222-8222-222222222222";
const GRANDCHILD_ID = "33333333-3333-4333-8333-333333333333";
const USER_B_FOLDER_ID = "44444444-4444-4444-8444-444444444444";

describe("documents actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({ user: { id: "user-a" } });

    mockInsertReturning.mockResolvedValue([]);
    mockUpdateReturning.mockResolvedValue([]);
    mockDeleteWhere.mockResolvedValue(undefined);
    mockFolderFindFirst.mockResolvedValue(null);
    mockFolderFindMany.mockResolvedValue([]);
  });

  it("createFolder 可在根目录创建文件夹", async () => {
    const { createFolder } = await import("./actions");

    mockInsertReturning.mockResolvedValueOnce([
      {
        id: ROOT_ID,
        userId: "user-a",
        name: "Root",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await createFolder("Root");

    expect(result.success).toBe(true);
    expect(result.folder?.name).toBe("Root");
    expect(result.folder?.parentId).toBeNull();
  });

  it("createFolder 可在指定父文件夹下创建子文件夹", async () => {
    const { createFolder } = await import("./actions");

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
        id: CHILD_ID,
        userId: "user-a",
        name: "Child",
        parentId: ROOT_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await createFolder("Child", ROOT_ID);

    expect(result.success).toBe(true);
    expect(result.folder?.parentId).toBe(ROOT_ID);
  });

  it("deleteFolder 会级联删除所有子文件夹", async () => {
    const { deleteFolder } = await import("./actions");

    mockFolderFindMany.mockResolvedValueOnce([
      { id: ROOT_ID, parentId: null },
      { id: CHILD_ID, parentId: ROOT_ID },
      { id: GRANDCHILD_ID, parentId: CHILD_ID },
    ]);

    const result = await deleteFolder(ROOT_ID);

    expect(result.success).toBe(true);
    expect(result.deletedIds).toEqual([ROOT_ID, CHILD_ID, GRANDCHILD_ID]);
  });

  it("不同用户的数据隔离：用户 A 不能操作用户 B 的文件夹", async () => {
    const { deleteFolder } = await import("./actions");

    mockFolderFindMany.mockResolvedValueOnce([{ id: ROOT_ID, parentId: null }]);

    const result = await deleteFolder(USER_B_FOLDER_ID);

    expect(result.success).toBe(false);
    expect(result.message).toContain("无权限");
  });
});
