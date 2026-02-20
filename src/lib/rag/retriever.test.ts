// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockInnerJoin = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

const mockGenerateEmbeddings = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelect,
  },
}));

vi.mock("@/lib/pipeline/embedder", () => ({
  generateEmbeddings: mockGenerateEmbeddings,
}));

describe("retrieveRelevantChunks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLimit.mockResolvedValue([]);
    mockOrderBy.mockReturnValue({ limit: mockLimit });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
    mockInnerJoin.mockReturnValue({ where: mockWhere });
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
    mockSelect.mockReturnValue({ from: mockFrom });

    mockGenerateEmbeddings.mockResolvedValue([[0.1, 0.2, 0.3]]);
  });

  it("空查询直接返回空数组", async () => {
    const { retrieveRelevantChunks } = await import("./retriever");

    const result = await retrieveRelevantChunks(" ", "user-a");

    expect(result).toEqual([]);
    expect(mockGenerateEmbeddings).not.toHaveBeenCalled();
  });

  it("返回检索结果并映射字段", async () => {
    const { retrieveRelevantChunks } = await import("./retriever");

    mockLimit.mockResolvedValueOnce([
      {
        documentId: "doc-1",
        fileName: "Demo.md",
        content: "content",
        metadata: { startOffset: 0 },
        similarity: 0.82,
      },
    ]);

    const result = await retrieveRelevantChunks("hello", "user-a", 3, 0.7);

    expect(mockGenerateEmbeddings).toHaveBeenCalledWith("user-a", ["hello"]);
    expect(result).toEqual([
      {
        documentId: "doc-1",
        fileName: "Demo.md",
        content: "content",
        metadata: { startOffset: 0 },
        similarity: 0.82,
      },
    ]);
  });

  it("Embedding 失败时抛出异常", async () => {
    const { retrieveRelevantChunks } = await import("./retriever");

    mockGenerateEmbeddings.mockRejectedValueOnce(new Error("embedding down"));

    await expect(retrieveRelevantChunks("hello", "user-a")).rejects.toThrow("embedding down");
  });
});
