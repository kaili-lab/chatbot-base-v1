export interface DocumentParser {
  supportedTypes: string[];
  parse(content: string, fileName: string): Promise<string>;
}

export type SupportedDocumentType = "md" | "txt";
