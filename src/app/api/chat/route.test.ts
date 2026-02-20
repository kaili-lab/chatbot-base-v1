// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UIMessage } from "ai";

const mockHeaders = vi.fn();
const mockGetSession = vi.fn();

const mockConversationFindFirst = vi.fn();
const mockSettingsFindFirst = vi.fn();
const mockMessagesFindFirst = vi.fn();

const mockInsertValues = vi.fn();
const mockInsert = vi.fn(() => ({
  values: mockInsertValues,
}));

const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn(() => ({
  where: mockUpdateWhere,
}));
const mockUpdate = vi.fn(() => ({
  set: mockUpdateSet,
}));

const mockTransaction = vi.fn(async (callback: (tx: any) => Promise<void>) => {
  await callback({
    insert: mockInsert,
    update: mockUpdate,
  });
});

let onFinishPromise: Promise<unknown> | null = null;

const mockStreamText = vi.fn((options: any) => {
  if (options.onFinish) {
    onFinishPromise = Promise.resolve(
      options.onFinish({
        text: "assistant reply",
        steps: [],
        totalUsage: {},
      })
    );
  }
  return {
    toUIMessageStreamResponse: () => new Response("ok"),
  };
});

const mockConvertToModelMessages = vi.fn(async () => []);

const mockRetrieveRelevantChunks = vi.fn();

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
        findFirst: mockConversationFindFirst,
      },
      settings: {
        findFirst: mockSettingsFindFirst,
      },
      messages: {
        findFirst: mockMessagesFindFirst,
      },
    },
    transaction: mockTransaction,
  },
}));

vi.mock("@/lib/crypto", () => ({
  decrypt: (value: string) => value,
}));

vi.mock("@/lib/rag/retriever", () => ({
  retrieveRelevantChunks: mockRetrieveRelevantChunks,
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: () => () => ({}),
}));

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");
  return {
    ...actual,
    streamText: mockStreamText,
    convertToModelMessages: mockConvertToModelMessages,
  };
});

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onFinishPromise = null;

    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({ user: { id: "user-a" } });

    mockConversationFindFirst.mockResolvedValue({
      id: "conv-1",
      title: "New Chat",
    });

    mockSettingsFindFirst.mockResolvedValue({
      llmBaseUrl: "https://api.example.com/v1",
      llmApiKey: "encrypted",
      llmModel: "gpt-test",
      embeddingModel: "text-embedding-3-small",
    });

    mockMessagesFindFirst.mockResolvedValue(null);
    mockInsertValues.mockResolvedValue(undefined);
    mockUpdateWhere.mockResolvedValue(undefined);
    mockRetrieveRelevantChunks.mockResolvedValue([]);
  });

  it("成功写入 user/assistant 消息并更新标题", async () => {
    const { POST } = await import("./route");

    const requestMessages: UIMessage[] = [
      {
        id: "m1",
        role: "user",
        parts: [{ type: "text", text: "Hello world" }],
      },
    ];

    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: "11111111-1111-4111-8111-111111111111",
        messages: requestMessages,
      }),
    });

    const response = await POST(req);
    await onFinishPromise;

    expect(response.status).toBe(200);
    expect(mockInsertValues).toHaveBeenCalled();

    const userInsertArg = mockInsertValues.mock.calls[0]?.[0] as {
      role: string;
      content: string;
    };
    expect(userInsertArg.role).toBe("user");
    expect(userInsertArg.content).toBe("Hello world");

    const assistantInsertArg = mockInsertValues.mock.calls[1]?.[0] as {
      role: string;
      content: string;
      sources: { type: string };
    };
    expect(assistantInsertArg.role).toBe("assistant");
    expect(assistantInsertArg.content).toBe("assistant reply");
    expect(assistantInsertArg.sources.type).toBe("general");

    const updateArg = mockUpdateSet.mock.calls[0]?.[0] as { title?: string };
    expect(updateArg.title).toBe("Hello world");
  });

  it("未登录时返回 401", async () => {
    const { POST } = await import("./route");

    mockGetSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: "11111111-1111-4111-8111-111111111111",
        messages: [],
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it("缺少 LLM 配置时返回 400", async () => {
    const { POST } = await import("./route");

    mockSettingsFindFirst.mockResolvedValueOnce({
      llmBaseUrl: null,
      llmApiKey: null,
      llmModel: null,
      embeddingModel: null,
    });

    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: "11111111-1111-4111-8111-111111111111",
        messages: [
          {
            id: "m1",
            role: "user",
            parts: [{ type: "text", text: "Hello world" }],
          },
        ],
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("Embedding 模型缺失时仍可正常处理", async () => {
    const { POST } = await import("./route");

    mockSettingsFindFirst.mockResolvedValueOnce({
      llmBaseUrl: "https://api.example.com/v1",
      llmApiKey: "encrypted",
      llmModel: "gpt-test",
      embeddingModel: null,
    });

    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: "11111111-1111-4111-8111-111111111111",
        messages: [
          {
            id: "m1",
            role: "user",
            parts: [{ type: "text", text: "Hello world" }],
          },
        ],
      }),
    });

    const response = await POST(req);
    await onFinishPromise;
    expect(response.status).toBe(200);
  });
});
