"use client";

import { useEffect, useRef, useState } from "react";

import { Check, ChevronRight, FileText, Folder, MoreHorizontal, NotebookPen, Pencil, Trash2, X } from "lucide-react";

import { type DocumentStatus } from "@/components/documents/document-status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FolderTreeNode = {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderTreeNode[];
};

export type DirectoryDocumentItem = {
  id: string;
  folderId: string | null;
  fileName: string;
  isNote: boolean;
  status: DocumentStatus;
};

type NewFolderDraft = {
  parentId: string | null;
  name: string;
};

type DirectoryTreeProps = {
  nodes: FolderTreeNode[];
  documents: DirectoryDocumentItem[];
  selectedFolderId: string | null;
  selectedDocumentId: string | null;
  expandedIds: Set<string>;
  renamingFolderId: string | null;
  renameValue: string;
  newFolderDraft: NewFolderDraft | null;
  onSelectFolder: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onSelectDocument: (document: DirectoryDocumentItem) => void;
  onStartRename: (folderId: string, currentName: string) => void;
  onRenameValueChange: (value: string) => void;
  onSubmitRename: (folderId: string) => void;
  onCancelRename: () => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onStartRenameDocument: (documentId: string, currentFileName: string) => void;
  onSubmitNewFolder: (value: string) => void;
  onCancelNewFolder: () => void;
};

function isImeComposing(
  event: React.KeyboardEvent<HTMLInputElement>,
  isComposingRef: React.MutableRefObject<boolean>
) {
  // WHAT: 统一判断输入框是否处于输入法组合态；WHY: 不同浏览器/输入法上信号不一致，单一字段会漏判，导致候选阶段被误当成普通按键处理。
  const nativeEvent = event.nativeEvent as KeyboardEvent;

  return (
    isComposingRef.current ||
    nativeEvent.isComposing ||
    nativeEvent.keyCode === 229 ||
    event.key === "Process"
  );
}

function DraftFolderInput({
  depth,
  value,
  onSubmit,
  onCancel,
}: {
  depth: number;
  value: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [inputValue, setInputValue] = useState(value);
  const isComposingRef = useRef(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div className="py-1" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
      <div className="flex items-center gap-2 rounded-md border border-dashed px-2 py-1.5">
        <Folder className="size-4 text-muted-foreground" />
        <Input
          autoFocus
          value={inputValue}
          placeholder="输入文件夹名称"
          className="h-7 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
          }}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();

            // 中文输入法在候选态按 Enter 是“选词”，不能当成提交
            if (isImeComposing(event, isComposingRef)) {
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit(inputValue);
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="保存文件夹"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSubmit(inputValue)}
        >
          <Check className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="取消创建文件夹"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onCancel}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function DirectoryTree({
  nodes,
  documents,
  selectedFolderId,
  selectedDocumentId,
  expandedIds,
  renamingFolderId,
  renameValue,
  newFolderDraft,
  onSelectFolder,
  onToggleFolder,
  onSelectDocument,
  onStartRename,
  onRenameValueChange,
  onSubmitRename,
  onCancelRename,
  onDeleteFolder,
  onDeleteDocument,
  onStartRenameDocument,
  onSubmitNewFolder,
  onCancelNewFolder,
}: DirectoryTreeProps) {
  const isRenameComposingRef = useRef(false);
  const documentsByFolderId = new Map<string | null, DirectoryDocumentItem[]>();
  for (const document of documents) {
    const list = documentsByFolderId.get(document.folderId) ?? [];
    list.push(document);
    documentsByFolderId.set(document.folderId, list);
  }

  const renderDocument = (document: DirectoryDocumentItem, depth: number) => {
    const isSelected = document.id === selectedDocumentId;

    return (
      <div
        key={document.id}
        className={cn(
          "group flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-1 py-1",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${depth * 16 + 22}px` }}
        onClick={() => onSelectDocument(document)}
      >
        {document.isNote ? (
          <NotebookPen className="size-4 text-muted-foreground" />
        ) : (
          <FileText className="size-4 text-muted-foreground" />
        )}

        <span className="min-w-0 flex-1 truncate text-sm">{document.fileName}</span>

        <div className="ml-auto flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  onStartRenameDocument(document.id, document.fileName);
                }}
              >
                <Pencil className="size-4" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteDocument(document.id);
                }}
              >
                <Trash2 className="size-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const renderNode = (node: FolderTreeNode, depth: number): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = node.id === selectedFolderId;
    const isRenaming = node.id === renamingFolderId;
    const showNewFolderInCurrent = newFolderDraft?.parentId === node.id;

    const childDocuments = documentsByFolderId.get(node.id) ?? [];

    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex min-w-0 cursor-pointer items-center gap-1 rounded-md px-1 py-1",
            isSelected && "bg-accent"
          )}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
          onClick={() => {
            onSelectFolder(node.id);
            onToggleFolder(node.id);
          }}
        >
          {hasChildren || childDocuments.length > 0 ? (
            <ChevronRight
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          ) : (
            <span className="inline-flex size-4" />
          )}

          <Folder className="size-4 text-muted-foreground" />

          {isRenaming ? (
            <>
              <Input
                autoFocus
                value={renameValue}
                className="h-7 min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                onClick={(event) => event.stopPropagation()}
                onCompositionStart={() => {
                  isRenameComposingRef.current = true;
                }}
                onCompositionEnd={() => {
                  isRenameComposingRef.current = false;
                }}
                onChange={(event) => onRenameValueChange(event.target.value)}
                onKeyDown={(event) => {
                  event.stopPropagation();

                  // 中文输入法在候选态按 Enter 是“选词”，不能当成提交
                  if (isImeComposing(event, isRenameComposingRef)) {
                    return;
                  }

                  if (event.key === "Enter") {
                    event.preventDefault();
                    onSubmitRename(node.id);
                    return;
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    onCancelRename();
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="shrink-0"
                aria-label="保存重命名"
                onClick={(event) => {
                  event.stopPropagation();
                  onSubmitRename(node.id);
                }}
              >
                <Check className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="shrink-0"
                aria-label="取消重命名"
                onClick={(event) => {
                  event.stopPropagation();
                  onCancelRename();
                }}
              >
                <X className="size-3.5" />
              </Button>
            </>
          ) : (
            <span className="min-w-0 flex-1 truncate text-sm">{node.name}</span>
          )}

          {!isRenaming && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    onStartRename(node.id, node.name);
                  }}
                >
                  <Pencil className="size-4" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteFolder(node.id);
                  }}
                >
                  <Trash2 className="size-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {showNewFolderInCurrent && (
          <DraftFolderInput
            depth={depth + 1}
            value={newFolderDraft.name}
            onSubmit={onSubmitNewFolder}
            onCancel={onCancelNewFolder}
          />
        )}

        {isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
            {childDocuments.map((document) => renderDocument(document, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => renderNode(node, 0))}
      {(documentsByFolderId.get(null) ?? []).map((document) => renderDocument(document, 0))}

      {newFolderDraft?.parentId === null && (
        <DraftFolderInput
          depth={0}
          value={newFolderDraft.name}
          onSubmit={onSubmitNewFolder}
          onCancel={onCancelNewFolder}
        />
      )}
    </div>
  );
}
