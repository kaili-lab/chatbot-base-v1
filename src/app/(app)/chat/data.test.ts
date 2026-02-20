// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConversationFindMany = vi.fn();
const mockConversationFindFirst = vi.fn();
const mockMessagesFindMany = vi.fn();
const mockSettingsFindFirst = vi.fn();

const mockHeaders = vi.fn();
const mockGetSession = vi.fn();

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
      conversations: {
        findMany: mockConversationFindMany,
        findFirst: mockConversationFindFirst,
      },
      messages: {
        findMany: mockMessagesFindMany,
      },
      settings: {
        findFirst: mockSettingsFindFirst,
      },
    },
  },
}));

describe("chat data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConversationFindMany.mockResolvedValue([]);
    mockConversationFindFirst.mockResolvedValue(null);
    mockMessagesFindMany.mockResolvedValue([]);
    mockSettingsFindFirst.mockResolvedValue(null);
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({ user: { id: "user-a" } });
  });

  it("getChatConversations 会按星标与时间排序", async () => {
    const { getChatConversations } = await import("./data");

    mockConversationFindMany.mockResolvedValueOnce([
      {
        id: "c1",
        title: "B",
        starred: false,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-02T00:00:00Z"),
      },
      {
        id: "c2",
        title: "A",
        starred: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      },
      {
        id: "c3",
        title: "C",
        starred: false,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-03T00:00:00Z"),
      },
    ]);

    const result = await getChatConversations("user-a");
    expect(result.map((item) => item.id)).toEqual(["c2", "c3", "c1"]);
  });

  it("getChatConversationData 找不到对话时返回空结果", async () => {
    const { getChatConversationData } = await import("./data");

    mockConversationFindFirst.mockResolvedValueOnce(null);

    const result = await getChatConversationData("user-a", "conv-1");

    expect(result.conversation).toBeNull();
    expect(result.messages).toHaveLength(0);
  });

  it("getChatConversationData 会映射消息与时间", async () => {
    const { getChatConversationData } = await import("./data");

    mockConversationFindFirst.mockResolvedValueOnce({
      id: "conv-1",
      title: "Demo",
      starred: false,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-04T00:00:00Z"),
    });

    mockMessagesFindMany.mockResolvedValueOnce([
      {
        id: "m1",
        role: "user",
        content: "hi",
        sources: null,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      },
      {
        id: "m2",
        role: "assistant",
        content: "hello",
        sources: { type: "general" },
        createdAt: new Date("2024-01-02T00:00:00Z"),
        updatedAt: new Date("2024-01-02T00:00:00Z"),
      },
    ]);

    const result = await getChatConversationData("user-a", "conv-1");

    expect(result.conversation?.id).toBe("conv-1");
    expect(result.messages).toHaveLength(2);
    expect(result.lastMessageAt).toBe("2024-01-02T00:00:00.000Z");
  });

  it("getChatSettingsSummary 缺少 embeddingModel 时标记未就绪", async () => {
    const { getChatSettingsSummary } = await import("./data");

    mockSettingsFindFirst.mockResolvedValueOnce({
      llmBaseUrl: "https://api.example.com",
      llmApiKey: "key",
      llmModel: "gpt-4",
      embeddingModel: null,
    });

    const result = await getChatSettingsSummary("user-a");

    expect(result.hasLlm).toBe(true);
    expect(result.embeddingReady).toBe(false);
  });

  it("getChatSettingsSummary 配置完整时返回模型", async () => {
    const { getChatSettingsSummary } = await import("./data");

    mockSettingsFindFirst.mockResolvedValueOnce({
      llmBaseUrl: "https://api.example.com",
      llmApiKey: "key",
      llmModel: "gpt-4",
      embeddingModel: "text-embedding-3-small",
    });

    const result = await getChatSettingsSummary("user-a");

    expect(result.hasLlm).toBe(true);
    expect(result.model).toBe("gpt-4");
    expect(result.embeddingReady).toBe(true);
  });
});
