// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindDocument = vi.fn();
const mockDeleteWhere = vi.fn();
const mockDelete = vi.fn(() => ({
  where: mockDeleteWhere,
}));

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

type TransactionClient = {
  delete: typeof mockDelete;
  insert: typeof mockInsert;
  update: typeof mockUpdate;
};

const mockTransaction = vi.fn(async (callback: (tx: TransactionClient) => Promise<void>) => {
  await callback({
    delete: mockDelete,
    insert: mockInsert,
    update: mockUpdate,
  });
});

const mockSplitTextIntoChunks = vi.fn();
const mockGenerateEmbeddings = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      documents: {
        findFirst: mockFindDocument,
      },
    },
    delete: mockDelete,
    insert: mockInsert,
    update: mockUpdate,
    transaction: mockTransaction,
  },
}));

vi.mock("./chunker", () => ({
  splitTextIntoChunks: mockSplitTextIntoChunks,
}));

vi.mock("./embedder", () => ({
  generateEmbeddings: mockGenerateEmbeddings,
}));

describe("processDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFindDocument.mockResolvedValue({
      id: "doc-1",
      content: "content",
    });

    mockSplitTextIntoChunks.mockReturnValue([
      {
        content: "chunk-1",
        chunkIndex: 0,
        metadata: {
          startOffset: 0,
          endOffset: 7,
        },
      },
      {
        content: "chunk-2",
        chunkIndex: 1,
        metadata: {
          startOffset: 7,
          endOffset: 14,
        },
      },
    ]);

    mockGenerateEmbeddings.mockResolvedValue([
      Array.from({ length: 1536 }, (_, index) => index * 0.001),
      Array.from({ length: 1536 }, (_, index) => index * 0.002),
    ]);

    mockDeleteWhere.mockResolvedValue(undefined);
    mockInsertValues.mockResolvedValue(undefined);
    mockUpdateWhere.mockResolvedValue(undefined);
  });

  it("处理完成后写入 embeddings，数量等于 chunk 数", async () => {
    const { processDocument } = await import("./index");

    const result = await processDocument("doc-1", "user-1");

    expect(result.chunkCount).toBe(2);
    expect(mockInsert).toHaveBeenCalledTimes(1);

    const insertArg = mockInsertValues.mock.calls[0]?.[0] as Array<{
      chunkIndex: number;
    }>;

    expect(insertArg).toHaveLength(2);
    expect(insertArg[0]?.chunkIndex).toBe(0);
    expect(insertArg[1]?.chunkIndex).toBe(1);
  });

  it("重处理时先删除旧 embeddings 再写入新数据", async () => {
    const { processDocument } = await import("./index");

    await processDocument("doc-1", "user-1");

    const deleteOrder = mockDeleteWhere.mock.invocationCallOrder[0] ?? 0;
    const insertOrder = mockInsertValues.mock.invocationCallOrder[0] ?? 0;

    expect(deleteOrder).toBeGreaterThan(0);
    expect(insertOrder).toBeGreaterThan(0);
    expect(deleteOrder).toBeLessThan(insertOrder);
  });

  it("Embedding 调用失败时将 documents.status 更新为 failed", async () => {
    const { processDocument } = await import("./index");

    mockGenerateEmbeddings.mockRejectedValueOnce(new Error("embedding down"));

    await expect(processDocument("doc-1", "user-1")).rejects.toThrow("embedding down");

    const failedUpdateArg = mockUpdateSet.mock.calls.at(-1)?.[0] as {
      status: string;
    };

    expect(failedUpdateArg.status).toBe("failed");
  });
});
