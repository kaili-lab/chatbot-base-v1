// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
const mockHeaders = vi.fn();
const mockFindFirst = vi.fn();
const mockOnConflictDoUpdate = vi.fn();
const mockValues = vi.fn(() => ({
  onConflictDoUpdate: mockOnConflictDoUpdate,
}));
const mockInsert = vi.fn(() => ({
  values: mockValues,
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
      settings: {
        findFirst: mockFindFirst,
      },
    },
    insert: mockInsert,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("ai", () => ({
  embed: vi.fn(),
  generateText: vi.fn(),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(),
}));

describe("settings actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 1).toString("base64");

    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockFindFirst.mockResolvedValue(null);
    mockOnConflictDoUpdate.mockResolvedValue(undefined);
  });

  it("saveSettings 会按 userId 执行 upsert", async () => {
    const { saveSettings } = await import("./actions");

    const result = await saveSettings({
      baseUrl: "https://api.openai.com/v1",
      apiKey: "sk-test-key",
      model: "gpt-4o",
      embeddingModel: "text-embedding-3-small",
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledTimes(1);
    expect(mockOnConflictDoUpdate).toHaveBeenCalledTimes(1);
  });

  it("saveSettings 存入数据库的 API Key 为加密值", async () => {
    const { saveSettings } = await import("./actions");

    const plaintext = "sk-plain-text";
    await saveSettings({
      baseUrl: "https://api.openai.com/v1",
      apiKey: plaintext,
      model: "gpt-4o",
      embeddingModel: "text-embedding-3-small",
    });

    const valuesArg = mockValues.mock.calls[0]?.[0] as { llmApiKey: string };

    expect(valuesArg.llmApiKey).toBeTypeOf("string");
    expect(valuesArg.llmApiKey).not.toBe(plaintext);
  });
});
