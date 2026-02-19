"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, FolderPlus, NotebookPen, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  createFolder,
  createNote,
  deleteDocument,
  deleteFolder,
  renameFolder,
  uploadDocuments,
} from "@/app/(app)/documents/actions";
import { DirectoryTree, type FolderTreeNode } from "@/components/documents/directory-tree";
import { DocumentDetailView } from "@/components/documents/document-detail-view";
import { FolderSelectorTree } from "@/components/documents/folder-selector-tree";
import { NoteEditor } from "@/components/documents/note-editor";
import type {
  DocumentDetail,
  WorkspaceDocument,
  WorkspaceFolder,
} from "@/components/documents/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type DocumentsWorkspaceProps = {
  initialFolders: WorkspaceFolder[];
  initialDocuments: WorkspaceDocument[];
  activeDocumentId?: string | null;
  view:
    | {
        type: "home";
      }
    | {
        type: "detail";
        document: DocumentDetail;
      }
    | {
        type: "edit";
        document: DocumentDetail;
      };
};

type NewFolderDraft = {
  parentId: string | null;
  name: string;
};

function buildFolderTree(folders: WorkspaceFolder[]) {
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

function collectAncestorIds(folders: WorkspaceFolder[], folderId: string) {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const ancestors = new Set<string>();

  let cursor = byId.get(folderId)?.parentId ?? null;
  while (cursor) {
    ancestors.add(cursor);
    cursor = byId.get(cursor)?.parentId ?? null;
  }

  return ancestors;
}

function collectDescendantIds(folders: WorkspaceFolder[], rootFolderId: string) {
  const byParent = new Map<string, string[]>();

  for (const folder of folders) {
    if (!folder.parentId) {
      continue;
    }

    const list = byParent.get(folder.parentId) ?? [];
    list.push(folder.id);
    byParent.set(folder.parentId, list);
  }

  const queue = [rootFolderId];
  const ids: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    ids.push(current);
    const children = byParent.get(current) ?? [];
    for (const childId of children) {
      queue.push(childId);
    }
  }

  return ids;
}

export function DocumentsWorkspace({
  initialFolders,
  initialDocuments,
  activeDocumentId = null,
  view,
}: DocumentsWorkspaceProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeDocument = useMemo(
    () => initialDocuments.find((item) => item.id === activeDocumentId) ?? null,
    [activeDocumentId, initialDocuments]
  );

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    activeDocument?.folderId ?? null
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newFolderDraft, setNewFolderDraft] = useState<NewFolderDraft | null>(null);

  const [isMutating, startMutation] = useTransition();

  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false);
  const [confirmRootDialogOpen, setConfirmRootDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteFolderId, setNewNoteFolderId] = useState<string | null>(null);
  const [newNoteExpandedIds, setNewNoteExpandedIds] = useState<Set<string>>(new Set());

  const [pendingDeleteFolderId, setPendingDeleteFolderId] = useState<string | null>(null);
  const [pendingDeleteDocumentId, setPendingDeleteDocumentId] = useState<string | null>(null);

  const treeNodes = useMemo(() => buildFolderTree(initialFolders), [initialFolders]);

  useEffect(() => {
    if (!activeDocument?.folderId) {
      return;
    }

    setSelectedFolderId(activeDocument.folderId);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(activeDocument.folderId as string);

      const ancestors = collectAncestorIds(initialFolders, activeDocument.folderId as string);
      for (const ancestorId of ancestors) {
        next.add(ancestorId);
      }

      return next;
    });
  }, [activeDocument?.folderId, initialFolders]);

  const pendingDeleteFolder = useMemo(
    () => initialFolders.find((folder) => folder.id === pendingDeleteFolderId) ?? null,
    [initialFolders, pendingDeleteFolderId]
  );

  const pendingDeleteFolderFileCount = useMemo(() => {
    if (!pendingDeleteFolderId) {
      return 0;
    }

    const subtreeIds = new Set(collectDescendantIds(initialFolders, pendingDeleteFolderId));
    return initialDocuments.filter((document) => document.folderId && subtreeIds.has(document.folderId))
      .length;
  }, [initialDocuments, initialFolders, pendingDeleteFolderId]);

  const pendingDeleteDocument = useMemo(
    () => initialDocuments.find((document) => document.id === pendingDeleteDocumentId) ?? null,
    [initialDocuments, pendingDeleteDocumentId]
  );

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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) {
      return;
    }

    const formData = new FormData();
    if (selectedFolderId) {
      formData.append("folderId", selectedFolderId);
    }

    Array.from(fileList).forEach((file) => {
      formData.append("files", file);
    });

    startMutation(async () => {
      const result = await uploadDocuments(formData);
      if (!result.success) {
        toast.error(result.message ?? "上传失败");
      } else {
        toast.success(result.message ?? "上传成功");
      }

      event.target.value = "";
      router.refresh();
    });
  };

  const openNewNoteDialog = () => {
    setNewNoteDialogOpen(true);
    setNewNoteTitle("");
    setNewNoteFolderId(selectedFolderId);
    setNewNoteExpandedIds(new Set(expandedIds));
  };

  const submitCreateNote = (forceRoot = false) => {
    const title = newNoteTitle.trim();
    if (!title) {
      toast.error("请输入笔记标题");
      return;
    }

    if (!newNoteFolderId && !forceRoot) {
      setConfirmRootDialogOpen(true);
      return;
    }

    startMutation(async () => {
      const result = await createNote(title, newNoteFolderId);
      if (!result.success || !result.document) {
        toast.error(result.message ?? "创建笔记失败");
        return;
      }

      toast.success("笔记创建成功");
      setNewNoteDialogOpen(false);
      setConfirmRootDialogOpen(false);
      router.push(`/documents/${result.document.id}/edit`);
      router.refresh();
    });
  };

  const confirmDeleteFolder = () => {
    if (!pendingDeleteFolderId) {
      return;
    }

    startMutation(async () => {
      const result = await deleteFolder(pendingDeleteFolderId);
      if (!result.success) {
        toast.error(result.message ?? "删除失败");
        return;
      }

      toast.success("文件夹删除成功");
      if (selectedFolderId && result.deletedIds?.includes(selectedFolderId)) {
        setSelectedFolderId(null);
      }
      setPendingDeleteFolderId(null);

      if (activeDocumentId && view.type !== "home") {
        router.push("/documents");
      }

      router.refresh();
    });
  };

  const confirmDeleteDocument = () => {
    if (!pendingDeleteDocumentId) {
      return;
    }

    startMutation(async () => {
      const result = await deleteDocument(pendingDeleteDocumentId);
      if (!result.success) {
        toast.error(result.message ?? "删除失败");
        return;
      }

      toast.success("文件删除成功");
      setPendingDeleteDocumentId(null);

      if (activeDocumentId === pendingDeleteDocumentId) {
        router.push("/documents");
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".md,.txt"
        multiple
        onChange={handleUploadChange}
      />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">文档管理</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit py-4">
          <CardContent className="space-y-3 px-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">DIRECTORY</p>

            <DirectoryTree
              nodes={treeNodes}
              documents={initialDocuments.map((document) => ({
                id: document.id,
                folderId: document.folderId,
                fileName: document.fileName,
                isNote: document.isNote,
                status: document.status,
              }))}
              selectedFolderId={selectedFolderId}
              selectedDocumentId={activeDocumentId}
              expandedIds={expandedIds}
              renamingFolderId={renamingFolderId}
              renameValue={renameValue}
              newFolderDraft={newFolderDraft}
              onSelectFolder={setSelectedFolderId}
              onToggleFolder={handleToggleFolder}
              onSelectDocument={(document) => {
                const nextPath = document.isNote
                  ? `/documents/${document.id}/edit`
                  : `/documents/${document.id}`;
                router.push(nextPath);
              }}
              onStartRename={handleStartRename}
              onRenameValueChange={setRenameValue}
              onSubmitRename={submitRename}
              onCancelRename={() => {
                setRenamingFolderId(null);
                setRenameValue("");
              }}
              onDeleteFolder={(folderId) => setPendingDeleteFolderId(folderId)}
              onDeleteDocument={(documentId) => setPendingDeleteDocumentId(documentId)}
              onNewFolderNameChange={(value) => {
                setNewFolderDraft((prev) => (prev ? { ...prev, name: value } : prev));
              }}
              onSubmitNewFolder={submitNewFolder}
              onCancelNewFolder={() => setNewFolderDraft(null)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="min-h-[420px] py-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {selectedFolderId ? "当前上传目录：已选择文件夹" : "当前上传目录：根目录"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button disabled={isMutating} onClick={handleCreateFolder}>
                  <FolderPlus className="size-4" />
                  New Folder
                </Button>
                <Button type="button" variant="outline" disabled={isMutating} onClick={openNewNoteDialog}>
                  <NotebookPen className="size-4" />
                  New Note
                </Button>
                <Button type="button" variant="outline" disabled={isMutating} onClick={handleUploadClick}>
                  <Upload className="size-4" />
                  Upload File
                </Button>
              </div>
            </div>

            {view.type === "home" && (
              <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-md border border-dashed text-center">
                <FileText className="size-8 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Knowledge Base</h2>
                  <p className="text-sm text-muted-foreground">
                    上传文件或创建笔记后，可以在左侧目录树查看并管理内容。
                  </p>
                </div>
              </div>
            )}

            {view.type === "detail" && <DocumentDetailView document={view.document} />}

            {view.type === "edit" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm" className="-ml-2">
                    <Link href={`/documents/${view.document.id}`}>
                      <ArrowLeft className="size-4" />
                      返回详情
                    </Link>
                  </Button>
                  <span className="text-sm text-muted-foreground">编辑笔记</span>
                </div>
                <h2 className="text-xl font-semibold tracking-tight">{view.document.fileName}</h2>
                <NoteEditor documentId={view.document.id} initialContent={view.document.content} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={newNoteDialogOpen} onOpenChange={setNewNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建笔记</DialogTitle>
            <DialogDescription>输入标题并选择保存目录（可选）。</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="note-title">
                笔记标题
              </label>
              <Input
                id="note-title"
                value={newNoteTitle}
                placeholder="例如：产品需求梳理"
                onChange={(event) => setNewNoteTitle(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">保存目录</p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={newNoteFolderId ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => setNewNoteFolderId(null)}
                >
                  根目录
                </Button>
                {newNoteFolderId && (
                  <span className="text-xs text-muted-foreground">已选中文件夹</span>
                )}
              </div>
              <FolderSelectorTree
                nodes={treeNodes}
                selectedFolderId={newNoteFolderId}
                expandedIds={newNoteExpandedIds}
                onSelectFolder={setNewNoteFolderId}
                onToggleFolder={(folderId) => {
                  setNewNoteExpandedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(folderId)) {
                      next.delete(folderId);
                    } else {
                      next.add(folderId);
                    }
                    return next;
                  });
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewNoteDialogOpen(false)}>
              取消
            </Button>
            <Button disabled={isMutating} onClick={() => submitCreateNote(false)}>
              {isMutating ? "创建中..." : "创建笔记"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRootDialogOpen} onOpenChange={setConfirmRootDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存到根目录？</DialogTitle>
            <DialogDescription>未选择目录时，文件会保存在根目录。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRootDialogOpen(false)}>
              返回选择
            </Button>
            <Button disabled={isMutating} onClick={() => submitCreateNote(true)}>
              确认保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDeleteFolder)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteFolderId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除文件夹</DialogTitle>
            <DialogDescription>
              确认删除“{pendingDeleteFolder?.name}”？该目录下 {pendingDeleteFolderFileCount} 个文件及子文件夹将被一并删除，删除后无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteFolderId(null)}>
              取消
            </Button>
            <Button variant="destructive" disabled={isMutating} onClick={confirmDeleteFolder}>
              {isMutating ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDeleteDocument)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteDocumentId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除文件</DialogTitle>
            <DialogDescription>
              确认删除“{pendingDeleteDocument?.fileName}”？删除后无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteDocumentId(null)}>
              取消
            </Button>
            <Button variant="destructive" disabled={isMutating} onClick={confirmDeleteDocument}>
              {isMutating ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
