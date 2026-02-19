import { MarkdownParser } from "./markdown-parser";
import { TextParser } from "./text-parser";
import type { DocumentParser, SupportedDocumentType } from "./types";

const parserRegistry = [new MarkdownParser(), new TextParser()];

export function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  if (parts.length < 2) {
    return "";
  }

  return parts.at(-1) ?? "";
}

export function getDocumentTypeByFileName(
  fileName: string
): SupportedDocumentType | null {
  const ext = getFileExtension(fileName);

  if (ext === "md" || ext === "markdown") {
    return "md";
  }

  if (ext === "txt") {
    return "txt";
  }

  return null;
}

export function getParserByFileName(fileName: string): DocumentParser {
  const ext = getFileExtension(fileName);

  const parser = parserRegistry.find((item) => item.supportedTypes.includes(ext));
  if (!parser) {
    throw new Error(`不支持的文件格式: ${ext || fileName}`);
  }

  return parser;
}
