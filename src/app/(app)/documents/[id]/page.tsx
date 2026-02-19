import type { Metadata } from "next";

import { DocumentsWorkspace } from "@/app/(app)/documents/documents-workspace";
import {
  getDocumentDetailById,
  getDocumentsWorkspaceData,
  requireDocumentsUserId,
} from "@/app/(app)/documents/data";

export const metadata: Metadata = { title: "Document Detail - Chatbot Base" };

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireDocumentsUserId();
  const { id } = await params;

  const [workspaceData, document] = await Promise.all([
    getDocumentsWorkspaceData(userId),
    getDocumentDetailById(id, userId),
  ]);

  return (
    <DocumentsWorkspace
      initialFolders={workspaceData.folders}
      initialDocuments={workspaceData.documents}
      activeDocumentId={document.id}
      view={{
        type: "detail",
        document,
      }}
    />
  );
}
