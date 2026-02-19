"use client";

import { ChevronRight, Folder, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export type FolderTreeNode = {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderTreeNode[];
};

type NewFolderDraft = {
  parentId: string | null;
  name: string;
};

type DirectoryTreeProps = {
  nodes: FolderTreeNode[];
  selectedFolderId: string | null;
  expandedIds: Set<string>;
  renamingFolderId: string | null;
  renameValue: string;
  newFolderDraft: NewFolderDraft | null;
  onSelectFolder: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onStartRename: (folderId: string, currentName: string) => void;
  onRenameValueChange: (value: string) => void;
  onSubmitRename: (folderId: string) => void;
  onCancelRename: () => void;
  onDeleteFolder: (folderId: string) => void;
  onNewFolderNameChange: (value: string) => void;
  onSubmitNewFolder: () => void;
  onCancelNewFolder: () => void;
};

function DraftFolderInput({
  depth,
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  depth: number;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="py-1" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
      <div className="flex items-center gap-2 rounded-md border border-dashed px-2 py-1.5">
        <Folder className="size-4 text-muted-foreground" />
        <Input
          autoFocus
          value={value}
          placeholder="输入文件夹名称"
          className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
            }
          }}
        />
      </div>
    </div>
  );
}

export function DirectoryTree({
  nodes,
  selectedFolderId,
  expandedIds,
  renamingFolderId,
  renameValue,
  newFolderDraft,
  onSelectFolder,
  onToggleFolder,
  onStartRename,
  onRenameValueChange,
  onSubmitRename,
  onCancelRename,
  onDeleteFolder,
  onNewFolderNameChange,
  onSubmitNewFolder,
  onCancelNewFolder,
}: DirectoryTreeProps) {
  const renderNode = (node: FolderTreeNode, depth: number): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = node.id === selectedFolderId;
    const isRenaming = node.id === renamingFolderId;
    const showNewFolderInCurrent = newFolderDraft?.parentId === node.id;

    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex cursor-pointer items-center gap-1 rounded-md px-1 py-1",
            isSelected && "bg-accent"
          )}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
          onClick={() => {
            onSelectFolder(node.id);
            onToggleFolder(node.id);
          }}
        >
          {hasChildren ? (
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
            <Input
              autoFocus
              value={renameValue}
              className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onRenameValueChange(event.target.value)}
              onKeyDown={(event) => {
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
          ) : (
            <span className="truncate text-sm">{node.name}</span>
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
            onChange={onNewFolderNameChange}
            onSubmit={onSubmitNewFolder}
            onCancel={onCancelNewFolder}
          />
        )}

        {isExpanded && hasChildren && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => renderNode(node, 0))}

      {newFolderDraft?.parentId === null && (
        <DraftFolderInput
          depth={0}
          value={newFolderDraft.name}
          onChange={onNewFolderNameChange}
          onSubmit={onSubmitNewFolder}
          onCancel={onCancelNewFolder}
        />
      )}
    </div>
  );
}
