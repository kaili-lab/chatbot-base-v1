import type { DocumentParser } from "./types";

export class TextParser implements DocumentParser {
  supportedTypes = ["txt"];

  async parse(content: string, _fileName: string): Promise<string> {
    return content;
  }
}
