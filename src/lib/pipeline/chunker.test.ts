// @vitest-environment node

import { describe, expect, it } from "vitest";

import { splitTextIntoChunks } from "@/lib/pipeline/chunker";

function overlapLength(left: string, right: string) {
  const maxLength = Math.min(left.length, right.length);

  for (let length = maxLength; length > 0; length -= 1) {
    if (left.slice(-length) === right.slice(0, length)) {
      return length;
    }
  }

  return 0;
}

describe("splitTextIntoChunks", () => {
  it("短文本返回单个 chunk", () => {
    const text = "这是一个短文本";

    const chunks = splitTextIntoChunks(text, { chunkSize: 100, chunkOverlap: 20 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toBe(text);
  });

  it("长文本含 Markdown 标题时优先按标题分割", () => {
    const text = `# 第一章\n${"A".repeat(70)}\n\n## 第二章\n${"B".repeat(70)}\n\n### 第三章\n${"C".repeat(70)}`;

    const chunks = splitTextIntoChunks(text, { chunkSize: 80, chunkOverlap: 12 });

    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks.some((chunk) => chunk.content.includes("# 第一章"))).toBe(true);
    expect(chunks.some((chunk) => chunk.content.includes("## 第二章"))).toBe(true);
    expect(chunks.some((chunk) => chunk.content.includes("### 第三章"))).toBe(true);
  });

  it("无标题时按空行分割", () => {
    const text = `${"段落一".repeat(20)}\n\n${"段落二".repeat(20)}\n\n${"段落三".repeat(20)}`;

    const chunks = splitTextIntoChunks(text, { chunkSize: 90, chunkOverlap: 10 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.content.includes("段落一")).toBe(true);
    expect(chunks.some((chunk) => chunk.content.includes("段落二"))).toBe(true);
  });

  it("单个超长段落按句号继续分割且长度不超过 chunkSize", () => {
    const sentence = "这是同一个段落里的句子。";
    const text = sentence.repeat(80);

    const chunks = splitTextIntoChunks(text, { chunkSize: 120, chunkOverlap: 20 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.content.length <= 120)).toBe(true);
  });

  it("相邻 chunk 保持 overlap", () => {
    const text = `${"甲".repeat(180)}\n\n${"乙".repeat(180)}\n\n${"丙".repeat(180)}`;

    const chunks = splitTextIntoChunks(text, { chunkSize: 160, chunkOverlap: 30 });

    expect(chunks.length).toBeGreaterThan(1);

    const first = chunks[0];
    const second = chunks[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();

    const overlap = overlapLength(first!.content, second!.content);
    expect(overlap).toBeGreaterThan(0);
    expect(second!.content.startsWith(first!.content.slice(-30))).toBe(true);
  });

  it("metadata 的 startOffset/endOffset 与内容切片一致", () => {
    const text = `# 标题\n${"内容".repeat(120)}`;

    const chunks = splitTextIntoChunks(text, { chunkSize: 70, chunkOverlap: 15 });

    for (const chunk of chunks) {
      const sliced = text.slice(chunk.metadata.startOffset, chunk.metadata.endOffset);
      expect(chunk.content).toBe(sliced);
      expect(chunk.metadata.startOffset).toBeGreaterThanOrEqual(0);
      expect(chunk.metadata.endOffset).toBeLessThanOrEqual(text.length);
      expect(chunk.metadata.startOffset).toBeLessThan(chunk.metadata.endOffset);
    }
  });

  it("空文本返回空数组", () => {
    expect(splitTextIntoChunks("", { chunkSize: 50, chunkOverlap: 10 })).toEqual([]);
    expect(splitTextIntoChunks("   ", { chunkSize: 50, chunkOverlap: 10 })).toEqual([]);
  });
});
