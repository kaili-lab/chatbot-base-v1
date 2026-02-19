import { ChevronRight, Folder } from "lucide-react";

import type { FolderTreeNode } from "@/components/documents/directory-tree";
import { cn } from "@/lib/utils";

type FolderSelectorTreeProps = {
  nodes: FolderTreeNode[];
  selectedFolderId: string | null;
  expandedIds: Set<string>;
  onSelectFolder: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
};

export function FolderSelectorTree({
  nodes,
  selectedFolderId,
  expandedIds,
  onSelectFolder,
  onToggleFolder,
}: FolderSelectorTreeProps) {
  const renderNode = (node: FolderTreeNode, depth: number): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = node.id === selectedFolderId;

    return (
      <div key={node.id}>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
            isSelected && "bg-accent"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onSelectFolder(node.id)}
          onDoubleClick={() => hasChildren && onToggleFolder(node.id)}
        >
          {hasChildren ? (
            <ChevronRight
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                isExpanded && "rotate-90"
              )}
              onClick={(event) => {
                event.stopPropagation();
                onToggleFolder(node.id);
              }}
            />
          ) : (
            <span className="inline-flex size-4" />
          )}
          <Folder className="size-4 text-muted-foreground" />
          <span className="truncate">{node.name}</span>
        </button>

        {isExpanded && hasChildren && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return <div className="max-h-64 overflow-y-auto rounded-md border p-2">{nodes.map((node) => renderNode(node, 0))}</div>;
}
