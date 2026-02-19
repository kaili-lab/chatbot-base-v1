import type { DocumentParser } from "./types";

export class MarkdownParser implements DocumentParser {
  supportedTypes = ["md", "markdown"];

  async parse(content: string, _fileName: string): Promise<string> {
    return content;
  }
}
