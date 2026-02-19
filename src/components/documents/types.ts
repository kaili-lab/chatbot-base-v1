import type { DocumentStatus } from "@/components/documents/document-status-badge";

export type WorkspaceFolder = {
  id: string;
  name: string;
  parentId: string | null;
};

export type WorkspaceDocument = {
  id: string;
  folderId: string | null;
  fileName: string;
  fileType: "md" | "txt";
  fileSize: number;
  isNote: boolean;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type DocumentDetail = WorkspaceDocument & {
  content: string;
  chunkCount: number;
};
