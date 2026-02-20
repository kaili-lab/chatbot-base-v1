"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Folder,
  FolderPlus,
  NotebookPen,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import {
  createFolder,
  createNote,
  deleteDocument,
  deleteFolder,
  renameDocument,
  renameFolder,
  uploadDocuments,
} from "@/app/(app)/documents/actions";
import { DirectoryTree, type FolderTreeNode } from "@/components/documents/directory-tree";
import { DocumentDetailView } from "@/components/documents/document-detail-view";
import { FolderSelectorTree } from "@/components/documents/folder-selector-tree";
import { NoteEditor } from "@/components/documents/note-editor";
import { useSetAppShellSidebarAddon } from "@/components/layout/app-shell-context";
import type {
  DocumentDetail,
  WorkspaceDocument,
  WorkspaceFolder,
} from "@/components/documents/types";
import { Button } from "@/components/ui/button";
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

type RenameDocumentDraft = {
  id: string;
  fileName: string;
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
  const setSidebarAddon = useSetAppShellSidebarAddon();
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

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [confirmUploadRootDialogOpen, setConfirmUploadRootDialogOpen] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [uploadExpandedIds, setUploadExpandedIds] = useState<Set<string>>(new Set());
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  const [pendingDeleteFolderId, setPendingDeleteFolderId] = useState<string | null>(null);
  const [pendingDeleteDocumentId, setPendingDeleteDocumentId] = useState<string | null>(null);
  const [renamingDocument, setRenamingDocument] = useState<RenameDocumentDraft | null>(null);
  const [renameDocumentValue, setRenameDocumentValue] = useState("");

  const treeNodes = useMemo(() => buildFolderTree(initialFolders), [initialFolders]);
  const visibleDocuments = useMemo(
    () => initialDocuments.filter((document) => document.status !== "failed"),
    [initialDocuments]
  );

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
    return initialDocuments.filter(
      (document) => document.folderId && subtreeIds.has(document.folderId)
    ).length;
  }, [initialDocuments, initialFolders, pendingDeleteFolderId]);

  const pendingDeleteDocument = useMemo(
    () => initialDocuments.find((document) => document.id === pendingDeleteDocumentId) ?? null,
    [initialDocuments, pendingDeleteDocumentId]
  );

  const handleToggleFolder = useCallback((folderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleCreateFolder = useCallback(() => {
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
  }, [initialFolders, selectedFolderId]);

  const submitNewFolder = useCallback((draftName: string) => {
    if (!newFolderDraft) {
      return;
    }

    const folderName = draftName.trim();
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
  }, [newFolderDraft, router]);

  const handleStartRename = useCallback((folderId: string, currentName: string) => {
    setRenamingFolderId(folderId);
    setRenameValue(currentName);
    setNewFolderDraft(null);
  }, []);

  const submitRename = useCallback(
    (folderId: string) => {
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
    },
    [renameValue, router]
  );

  const handleStartRenameDocument = useCallback((documentId: string, currentFileName: string) => {
    setRenamingDocument({
      id: documentId,
      fileName: currentFileName,
    });
    setRenameDocumentValue(currentFileName);
  }, []);

  const submitRenameDocument = useCallback(() => {
    if (!renamingDocument) {
      return;
    }

    const nextName = renameDocumentValue.trim();
    if (!nextName) {
      toast.error("请输入文件名");
      return;
    }

    startMutation(async () => {
      const result = await renameDocument(renamingDocument.id, nextName);
      if (!result.success) {
        toast.error(result.message ?? "重命名文件失败");
        return;
      }

      toast.success("文件重命名成功");
      setRenamingDocument(null);
      setRenameDocumentValue("");
      router.refresh();
    });
  }, [renameDocumentValue, renamingDocument, router]);

  const openUploadDialog = useCallback(() => {
    setUploadDialogOpen(true);
    setUploadFolderId(null);
    setUploadExpandedIds(new Set(expandedIds));
    setUploadFiles([]);
  }, [expandedIds]);

  const handleUploadFilesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files;
      if (!fileList) {
        return;
      }

      const nextFiles = Array.from(fileList).filter((file) => file.size > 0);
      setUploadFiles(nextFiles);
    },
    []
  );

  const submitUpload = useCallback(
    (forceRoot = false) => {
      if (uploadFiles.length === 0) {
        toast.error("请先选择要上传的文件");
        return;
      }

      if (!uploadFolderId && !forceRoot) {
        setConfirmUploadRootDialogOpen(true);
        return;
      }

      const formData = new FormData();
      if (uploadFolderId) {
        formData.append("folderId", uploadFolderId);
      }

      uploadFiles.forEach((file) => {
        formData.append("files", file);
      });

      startMutation(async () => {
        const result = await uploadDocuments(formData);
        if (!result.success) {
          toast.error(result.message ?? "上传失败");
        } else {
          toast.success(result.message ?? "上传成功");
        }
        if (result.failedFiles && result.failedFiles.length > 0) {
          const previewLimit = 5;
          const previewList = result.failedFiles
            .slice(0, previewLimit)
            .map((item) => `${item.fileName}（${item.reason}）`);
          const suffix =
            result.failedFiles.length > previewLimit
              ? ` 等 ${result.failedFiles.length} 个`
              : "";
          toast.error(`以下文件上传失败：${previewList.join("；")}${suffix}`);
        }

        setUploadDialogOpen(false);
        setConfirmUploadRootDialogOpen(false);
        setUploadFiles([]);
        setUploadFolderId(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        router.refresh();
      });
    },
    [router, uploadFiles, uploadFolderId]
  );

  const openNewNoteDialog = useCallback(() => {
    setNewNoteDialogOpen(true);
    setNewNoteTitle("");
    setNewNoteFolderId(selectedFolderId);
    setNewNoteExpandedIds(new Set(expandedIds));
  }, [expandedIds, selectedFolderId]);

  const submitCreateNote = useCallback(
    (forceRoot = false) => {
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
    },
    [newNoteFolderId, newNoteTitle, router]
  );

  const confirmDeleteFolder = useCallback(() => {
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
  }, [activeDocumentId, pendingDeleteFolderId, router, selectedFolderId, view.type]);

  const confirmDeleteDocument = useCallback(() => {
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
  }, [activeDocumentId, pendingDeleteDocumentId, router]);

  const handleSelectDocument = useCallback(
    (document: {
      id: string;
      isNote: boolean;
    }) => {
      const nextPath = document.isNote
        ? `/documents/${document.id}/edit`
        : `/documents/${document.id}`;
      router.push(nextPath);
    },
    [router]
  );

  const sidebarTree = useMemo(
    () => (
      <div className="space-y-2 pb-3">
        <p className="px-1 text-[11px] font-semibold tracking-wide text-muted-foreground">
          DIRECTORY
        </p>
        <button
          type="button"
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
            selectedFolderId === null
              ? "bg-accent text-foreground ring-1 ring-border"
              : "text-foreground/85 hover:bg-accent/60"
          }`}
          onClick={() => setSelectedFolderId(null)}
        >
          <Folder className="size-4 text-muted-foreground" />
          <span>根目录</span>
        </button>
        <DirectoryTree
          nodes={treeNodes}
          documents={visibleDocuments.map((document) => ({
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
          onSelectDocument={handleSelectDocument}
          onStartRename={handleStartRename}
          onRenameValueChange={setRenameValue}
          onSubmitRename={submitRename}
          onCancelRename={() => {
            setRenamingFolderId(null);
            setRenameValue("");
          }}
          onDeleteFolder={(folderId) => setPendingDeleteFolderId(folderId)}
          onDeleteDocument={(documentId) => setPendingDeleteDocumentId(documentId)}
          onStartRenameDocument={handleStartRenameDocument}
          onSubmitNewFolder={submitNewFolder}
          onCancelNewFolder={() => setNewFolderDraft(null)}
        />
      </div>
    ),
    [
      activeDocumentId,
      expandedIds,
      handleSelectDocument,
      handleStartRename,
      handleStartRenameDocument,
      handleToggleFolder,
      visibleDocuments,
      newFolderDraft,
      renameValue,
      renamingFolderId,
      selectedFolderId,
      submitNewFolder,
      submitRename,
      treeNodes,
    ]
  );

  useEffect(() => {
    setSidebarAddon(sidebarTree);

    return () => {
      setSidebarAddon(null);
    };
  }, [setSidebarAddon, sidebarTree]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-background">
      <div className="flex min-h-0 flex-1 flex-col">
        {view.type === "home" && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <FileText className="size-8 text-muted-foreground" />
            </div>
            <h2 className="text-4xl font-semibold tracking-tight text-foreground/90">
              Knowledge Base
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Select a document from the sidebar to view its content, or add new
              content to your knowledge base.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isMutating}
                onClick={handleCreateFolder}
              >
                <FolderPlus className="size-4" />
                New Folder
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isMutating}
                onClick={openNewNoteDialog}
              >
                <NotebookPen className="size-4" />
                New Note
              </Button>
              <Button type="button" disabled={isMutating} onClick={openUploadDialog}>
                <Upload className="size-4" />
                Upload File
              </Button>
            </div>
          </div>
        )}

        {view.type === "detail" && (
          <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
            <DocumentDetailView document={view.document} />
          </div>
        )}

        {view.type === "edit" && (
          <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
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
              <h2 className="text-2xl font-semibold tracking-tight">{view.document.fileName}</h2>
              <NoteEditor
                documentId={view.document.id}
                initialContent={view.document.content}
              />
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) {
            setUploadFiles([]);
            setUploadFolderId(null);
            setConfirmUploadRootDialogOpen(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>上传文件</DialogTitle>
            <DialogDescription>选择文件并指定保存目录（可选）。</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="upload-files">
                选择文件
              </label>
              <input
                id="upload-files"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".md,.txt"
                multiple
                onChange={handleUploadFilesChange}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isMutating}
                  onClick={() => fileInputRef.current?.click()}
                >
                  选择文件
                </Button>
                <span className="text-xs text-muted-foreground">
                  {uploadFiles.length > 0
                    ? `已选择 ${uploadFiles.length} 个文件`
                    : "未选择文件"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">保存目录</p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={uploadFolderId ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => setUploadFolderId(null)}
                >
                  根目录
                </Button>
                {uploadFolderId && (
                  <span className="text-xs text-muted-foreground">已选中文件夹</span>
                )}
              </div>
              <FolderSelectorTree
                nodes={treeNodes}
                selectedFolderId={uploadFolderId}
                expandedIds={uploadExpandedIds}
                onSelectFolder={setUploadFolderId}
                onToggleFolder={(folderId) => {
                  setUploadExpandedIds((prev) => {
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
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              取消
            </Button>
            <Button disabled={isMutating} onClick={() => submitUpload(false)}>
              {isMutating ? "上传中..." : "开始上传"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmUploadRootDialogOpen}
        onOpenChange={setConfirmUploadRootDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传到根目录？</DialogTitle>
            <DialogDescription>未选择目录时，文件会保存在根目录。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUploadRootDialogOpen(false)}>
              返回选择
            </Button>
            <Button disabled={isMutating} onClick={() => submitUpload(true)}>
              {isMutating ? "上传中..." : "确认上传"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newNoteDialogOpen} onOpenChange={setNewNoteDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
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
              <p className="text-xs text-muted-foreground">
                标题需全局唯一，系统会自动保存为 .md
              </p>
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
        open={Boolean(renamingDocument)}
        onOpenChange={(open) => {
          if (!open) {
            setRenamingDocument(null);
            setRenameDocumentValue("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名文件</DialogTitle>
            <DialogDescription>
              当前文件：{renamingDocument?.fileName}。请输入新的文件名，系统会自动保留原有文件后缀。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="rename-document-input" className="text-sm font-medium">
              文件名
            </label>
            <Input
              id="rename-document-input"
              autoFocus
              value={renameDocumentValue}
              onChange={(event) => setRenameDocumentValue(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">名称需全局唯一</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenamingDocument(null);
                setRenameDocumentValue("");
              }}
            >
              取消
            </Button>
            <Button disabled={isMutating} onClick={submitRenameDocument}>
              {isMutating ? "保存中..." : "确认保存"}
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
              确认删除“{pendingDeleteFolder?.name}”？该目录下 {pendingDeleteFolderFileCount}{" "}
              个文件及子文件夹将被一并删除，删除后无法恢复。
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
