// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHeaders = vi.fn();
const mockGetSession = vi.fn();
const mockRevalidatePath = vi.fn();

const mockConversationFindFirst = vi.fn();
const mockMessageFindFirst = vi.fn();

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

const mockDeleteReturning = vi.fn();
const mockDeleteWhere = vi.fn(() => ({
  returning: mockDeleteReturning,
}));
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

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      conversations: {
        findFirst: mockConversationFindFirst,
      },
      messages: {
        findFirst: mockMessageFindFirst,
      },
    },
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

describe("chat actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({ user: { id: "user-a" } });

    mockConversationFindFirst.mockResolvedValue(null);
    mockMessageFindFirst.mockResolvedValue(null);
    mockInsertReturning.mockResolvedValue([]);
    mockUpdateReturning.mockResolvedValue([]);
    mockDeleteReturning.mockResolvedValue([]);
  });

  it("createConversation 创建新对话", async () => {
    const { createConversation } = await import("./actions");

    mockInsertReturning.mockResolvedValueOnce([
      {
        id: "conv-1",
        userId: "user-a",
        title: "New Chat",
        starred: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await createConversation();

    expect(result.success).toBe(true);
    expect(result.conversation?.title).toBe("New Chat");

    const insertArg = mockInsertValues.mock.calls[0]?.[0] as {
      userId: string;
      title: string;
    };

    expect(insertArg.userId).toBe("user-a");
    expect(insertArg.title).toBe("New Chat");
  });

  it("createConversation 未登录时失败", async () => {
    const { createConversation } = await import("./actions");

    mockGetSession.mockResolvedValueOnce(null);

    const result = await createConversation();

    expect(result.success).toBe(false);
    expect(result.message).toBe("登录状态已失效，请重新登录");
  });

  it("createConversation 数据库异常时失败", async () => {
    const { createConversation } = await import("./actions");

    mockInsertValues.mockImplementationOnce(() => {
      throw new Error("db error");
    });

    const result = await createConversation();

    expect(result.success).toBe(false);
    expect(result.message).toBe("创建对话失败，请稍后重试");
  });

  it("toggleStar 可切换星标", async () => {
    const { toggleStar } = await import("./actions");

    mockConversationFindFirst.mockResolvedValueOnce({
      id: "conv-1",
      userId: "user-a",
      title: "Chat",
      starred: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUpdateReturning.mockResolvedValueOnce([
      {
        id: "conv-1",
        userId: "user-a",
        title: "Chat",
        starred: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await toggleStar("11111111-1111-4111-8111-111111111111");

    expect(result.success).toBe(true);
    expect(result.conversation?.starred).toBe(true);

    const updateArg = mockUpdateSet.mock.calls[0]?.[0] as { starred: boolean };
    expect(updateArg.starred).toBe(true);
  });

  it("toggleStar 未找到对话时失败", async () => {
    const { toggleStar } = await import("./actions");

    mockConversationFindFirst.mockResolvedValueOnce(null);

    const result = await toggleStar("11111111-1111-4111-8111-111111111111");

    expect(result.success).toBe(false);
    expect(result.message).toBe("对话不存在或无权限");
  });

  it("toggleStar 数据库异常时失败", async () => {
    const { toggleStar } = await import("./actions");

    mockConversationFindFirst.mockResolvedValueOnce({
      id: "conv-1",
      userId: "user-a",
      title: "Chat",
      starred: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUpdateSet.mockImplementationOnce(() => {
      throw new Error("db error");
    });

    const result = await toggleStar("11111111-1111-4111-8111-111111111111");

    expect(result.success).toBe(false);
    expect(result.message).toBe("星标更新失败，请稍后重试");
  });

  it("renameConversation 更新标题", async () => {
    const { renameConversation } = await import("./actions");

    mockUpdateReturning.mockResolvedValueOnce([
      {
        id: "conv-1",
        userId: "user-a",
        title: "新标题",
        starred: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await renameConversation(
      "11111111-1111-4111-8111-111111111111",
      "新标题"
    );

    expect(result.success).toBe(true);
    expect(result.conversation?.title).toBe("新标题");
  });

  it("renameConversation 标题为空时失败", async () => {
    const { renameConversation } = await import("./actions");

    const result = await renameConversation(
      "11111111-1111-4111-8111-111111111111",
      ""
    );

    expect(result.success).toBe(false);
  });

  it("renameConversation 数据库异常时失败", async () => {
    const { renameConversation } = await import("./actions");

    mockUpdateSet.mockImplementationOnce(() => {
      throw new Error("db error");
    });

    const result = await renameConversation(
      "11111111-1111-4111-8111-111111111111",
      "新标题"
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("重命名失败，请稍后重试");
  });

  it("deleteConversation 删除成功", async () => {
    const { deleteConversation } = await import("./actions");

    mockDeleteReturning.mockResolvedValueOnce([
      {
        id: "conv-1",
        userId: "user-a",
        title: "Chat",
        starred: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await deleteConversation("11111111-1111-4111-8111-111111111111");

    expect(result.success).toBe(true);
    expect(result.conversation?.id).toBe("conv-1");
  });

  it("deleteUnstarredConversations 删除未收藏对话", async () => {
    const { deleteUnstarredConversations } = await import("./actions");

    mockDeleteReturning.mockResolvedValueOnce([
      { id: "conv-1" },
      { id: "conv-2" },
    ]);

    const result = await deleteUnstarredConversations();

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(2);
  });

  it("deleteUnstarredConversations 未登录时失败", async () => {
    const { deleteUnstarredConversations } = await import("./actions");

    mockGetSession.mockResolvedValueOnce(null);

    const result = await deleteUnstarredConversations();

    expect(result.success).toBe(false);
    expect(result.message).toBe("登录状态已失效，请重新登录");
  });

  it("deleteUnstarredConversations 数据库异常时失败", async () => {
    const { deleteUnstarredConversations } = await import("./actions");

    mockDeleteWhere.mockImplementationOnce(() => {
      throw new Error("db error");
    });

    const result = await deleteUnstarredConversations();

    expect(result.success).toBe(false);
    expect(result.message).toBe("批量删除对话失败，请稍后重试");
  });

  it("getLatestAssistantSources 返回最新来源", async () => {
    const { getLatestAssistantSources } = await import("./actions");

    mockConversationFindFirst.mockResolvedValueOnce({
      id: "conv-1",
      userId: "user-a",
    });

    mockMessageFindFirst.mockResolvedValueOnce({
      sources: { type: "general" },
    });

    const result = await getLatestAssistantSources("11111111-1111-4111-8111-111111111111");

    expect(result.success).toBe(true);
    expect(result.sources).toEqual({ type: "general" });
  });

  it("getLatestAssistantSources 未登录时失败", async () => {
    const { getLatestAssistantSources } = await import("./actions");

    mockGetSession.mockResolvedValueOnce(null);

    const result = await getLatestAssistantSources("11111111-1111-4111-8111-111111111111");

    expect(result.success).toBe(false);
    expect(result.message).toBe("登录状态已失效，请重新登录");
  });

  it("deleteConversation 未找到时失败", async () => {
    const { deleteConversation } = await import("./actions");

    mockDeleteReturning.mockResolvedValueOnce([]);

    const result = await deleteConversation("11111111-1111-4111-8111-111111111111");

    expect(result.success).toBe(false);
    expect(result.message).toBe("对话不存在或无权限");
  });

  it("deleteConversation 数据库异常时失败", async () => {
    const { deleteConversation } = await import("./actions");

    mockDeleteWhere.mockImplementationOnce(() => {
      throw new Error("db error");
    });

    const result = await deleteConversation(
      "11111111-1111-4111-8111-111111111111"
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("删除对话失败，请稍后重试");
  });
});
