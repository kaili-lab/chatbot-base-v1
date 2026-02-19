// @vitest-environment node

import { describe, expect, it } from "vitest";

import { getParserByFileName } from "@/lib/parsers";
import { MarkdownParser } from "@/lib/parsers/markdown-parser";
import { TextParser } from "@/lib/parsers/text-parser";

describe("Document parsers", () => {
  it("MarkdownParser 返回完整 markdown 文本", async () => {
    const parser = new MarkdownParser();
    const content = "# 标题\n\n内容";

    await expect(parser.parse(content, "demo.md")).resolves.toBe(content);
  });

  it("TextParser 返回完整 txt 文本", async () => {
    const parser = new TextParser();
    const content = "plain text";

    await expect(parser.parse(content, "demo.txt")).resolves.toBe(content);
  });

  it("解析器注册表: .md 匹配 MarkdownParser", () => {
    const parser = getParserByFileName("demo.md");
    expect(parser).toBeInstanceOf(MarkdownParser);
  });

  it("解析器注册表: .txt 匹配 TextParser", () => {
    const parser = getParserByFileName("demo.txt");
    expect(parser).toBeInstanceOf(TextParser);
  });

  it("解析器注册表: 不支持类型抛出错误", () => {
    expect(() => getParserByFileName("demo.pdf")).toThrow("不支持的文件格式");
  });
});
