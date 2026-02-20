export type KnowledgeBaseChunk = {
  documentId: string;
  fileName: string;
  content: string;
  metadata?: unknown;
  similarity: number;
};

export type MessageSource =
  | {
      type: "knowledge_base";
      chunks: KnowledgeBaseChunk[];
    }
  | {
      type: "general";
    };

export type ChatMessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: MessageSource | null;
  createdAt: string;
};

export type ChatConversationSummary = {
  id: string;
  title: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatSettingsSummary = {
  hasLlm: boolean;
  model: string;
  embeddingReady: boolean;
};
