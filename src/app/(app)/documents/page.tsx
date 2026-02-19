import type { Metadata } from "next";

import { DocumentsWorkspace } from "./documents-workspace";
import { getDocumentsWorkspaceData, requireDocumentsUserId } from "./data";

export const metadata: Metadata = { title: "Documents - Chatbot Base" };

export default async function DocumentsPage() {
  const userId = await requireDocumentsUserId();
  const workspaceData = await getDocumentsWorkspaceData(userId);

  return (
    <DocumentsWorkspace
      initialFolders={workspaceData.folders}
      initialDocuments={workspaceData.documents}
      view={{ type: "home" }}
    />
  );
}
