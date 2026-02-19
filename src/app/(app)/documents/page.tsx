import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema";

import { DocumentsWorkspace } from "./documents-workspace";

export const metadata: Metadata = { title: "Documents - Chatbot Base" };

export default async function DocumentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const folderRows = await db.query.folders.findMany({
    where: eq(folders.userId, session.user.id),
    columns: {
      id: true,
      name: true,
      parentId: true,
    },
    orderBy: [asc(folders.createdAt)],
  });

  return <DocumentsWorkspace initialFolders={folderRows} />;
}
