"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, NotebookPen, Upload } from "lucide-react";
import { toast } from "sonner";

import { DirectoryTree, type FolderTreeNode } from "@/components/documents/directory-tree";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { createFolder, deleteFolder, renameFolder } from "./actions";

type FlatFolder = {
  id: string;
  name: string;
  parentId: string | null;
};

type DocumentsWorkspaceProps = {
  initialFolders: FlatFolder[];
};

type NewFolderDraft = {
  parentId: string | null;
  name: string;
};

function buildFolderTree(folders: FlatFolder[]) {
  const nodeMap = new Map<string, FolderTreeNode>();

  for (const folder of folders) {
    nodeMap.set(folder.id, {
      ...folder,
      children: [],
    });
  }

  const roots: FolderTreeNode[] = [];

  for (const folder of folders) {
    const node = nodeMap.get(folder.id);
    if (!node) {
      continue;
    }

    if (!folder.parentId) {
      roots.push(node);
      continue;
    }

    const parent = nodeMap.get(folder.parentId);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function collectAncestorIds(folders: FlatFolder[], folderId: string) {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const ancestors = new Set<string>();

  let cursor = byId.get(folderId)?.parentId ?? null;
  while (cursor) {
    ancestors.add(cursor);
    cursor = byId.get(cursor)?.parentId ?? null;
  }

  return ancestors;
}

export function DocumentsWorkspace({ initialFolders }: DocumentsWorkspaceProps) {
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newFolderDraft, setNewFolderDraft] = useState<NewFolderDraft | null>(null);
  const [isMutating, startMutation] = useTransition();

  const treeNodes = useMemo(() => buildFolderTree(initialFolders), [initialFolders]);

  const handleToggleFolder = (folderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = () => {
    const parentId = selectedFolderId ?? null;

    if (parentId) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(parentId);

        const ancestors = collectAncestorIds(initialFolders, parentId);
        for (const ancestorId of ancestors) {
          next.add(ancestorId);
        }

        return next;
      });
    }

    setNewFolderDraft({
      parentId,
      name: "",
    });
    setRenamingFolderId(null);
  };

  const submitNewFolder = () => {
    if (!newFolderDraft) {
      return;
    }

    const folderName = newFolderDraft.name.trim();
    if (!folderName) {
      toast.error("请输入文件夹名称");
      return;
    }

    startMutation(async () => {
      const result = await createFolder(folderName, newFolderDraft.parentId);
      if (!result.success || !result.folder) {
        toast.error(result.message ?? "创建文件夹失败");
        return;
      }

      toast.success("文件夹创建成功");
      setSelectedFolderId(result.folder.id);
      setNewFolderDraft(null);

      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (result.folder?.parentId) {
          next.add(result.folder.parentId);
        }
        return next;
      });

      router.refresh();
    });
  };

  const handleStartRename = (folderId: string, currentName: string) => {
    setRenamingFolderId(folderId);
    setRenameValue(currentName);
    setNewFolderDraft(null);
  };

  const submitRename = (folderId: string) => {
    const nextName = renameValue.trim();
    if (!nextName) {
      toast.error("请输入文件夹名称");
      return;
    }

    startMutation(async () => {
      const result = await renameFolder(folderId, nextName);
      if (!result.success) {
        toast.error(result.message ?? "重命名失败");
        return;
      }

      toast.success("重命名成功");
      setRenamingFolderId(null);
      setRenameValue("");
      router.refresh();
    });
  };

  const handleDeleteFolder = (folderId: string) => {
    if (!window.confirm("确认删除该文件夹及其子文件夹吗？")) {
      return;
    }

    startMutation(async () => {
      const result = await deleteFolder(folderId);
      if (!result.success) {
        toast.error(result.message ?? "删除失败");
        return;
      }

      toast.success("删除成功");
      if (selectedFolderId && result.deletedIds?.includes(selectedFolderId)) {
        setSelectedFolderId(null);
      }

      setRenamingFolderId(null);
      setRenameValue("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">文档管理</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="h-fit py-4">
          <CardContent className="space-y-3 px-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">
              DIRECTORY
            </p>

            <DirectoryTree
              nodes={treeNodes}
              selectedFolderId={selectedFolderId}
              expandedIds={expandedIds}
              renamingFolderId={renamingFolderId}
              renameValue={renameValue}
              newFolderDraft={newFolderDraft}
              onSelectFolder={setSelectedFolderId}
              onToggleFolder={handleToggleFolder}
              onStartRename={handleStartRename}
              onRenameValueChange={setRenameValue}
              onSubmitRename={submitRename}
              onCancelRename={() => {
                setRenamingFolderId(null);
                setRenameValue("");
              }}
              onDeleteFolder={handleDeleteFolder}
              onNewFolderNameChange={(value) => {
                setNewFolderDraft((prev) => (prev ? { ...prev, name: value } : prev));
              }}
              onSubmitNewFolder={submitNewFolder}
              onCancelNewFolder={() => setNewFolderDraft(null)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-6 text-center">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">Knowledge Base</h2>
              <p className="text-sm text-muted-foreground">
                当前还没有文件，先创建目录或添加内容开始构建知识库。
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button disabled={isMutating} onClick={handleCreateFolder}>
                <FolderPlus className="size-4" />
                New Folder
              </Button>
              <Button type="button" variant="outline" disabled>
                <NotebookPen className="size-4" />
                New Note
              </Button>
              <Button type="button" variant="outline" disabled>
                <Upload className="size-4" />
                Upload File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
