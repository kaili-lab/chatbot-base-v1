"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, NotebookPen, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteDocument } from "@/app/(app)/documents/actions";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import type { DocumentDetail } from "@/components/documents/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MarkdownEditor = dynamic(
  async () => (await import("@uiw/react-md-editor")).default,
  { ssr: false }
);

function formatFileSize(fileSize: number) {
  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${Math.round(fileSize / 1024)} KB`;
  }

  return `${(fileSize / 1024 / 1024).toFixed(1)} MB`;
}

type DocumentDetailViewProps = {
  document: DocumentDetail;
};

export function DocumentDetailView({ document }: DocumentDetailViewProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  const handleDelete = () => {
    startDeleting(async () => {
      const result = await deleteDocument(document.id);

      if (!result.success) {
        toast.error(result.message ?? "删除失败");
        return;
      }

      toast.success("文件删除成功");
      setDeleteDialogOpen(false);
      router.push("/documents");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
            <Link href="/documents">
              <ArrowLeft className="size-4" />
              返回文档列表
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            {document.isNote ? (
              <NotebookPen className="size-5 text-muted-foreground" />
            ) : (
              <FileText className="size-5 text-muted-foreground" />
            )}
            <h1 className="text-2xl font-semibold tracking-tight">{document.fileName}</h1>
          </div>

          <p className="text-sm text-muted-foreground">
            {new Date(document.createdAt).toLocaleDateString("zh-CN")} • {formatFileSize(document.fileSize)}
            {document.status === "completed" && ` • ${document.chunkCount} chunks indexed`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DocumentStatusBadge status={document.status} />
          {document.isNote && (
            <Button asChild variant="outline">
              <Link href={`/documents/${document.id}/edit`}>编辑</Link>
            </Button>
          )}
          <Button variant="ghost" className="text-destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="size-4" />
            删除
          </Button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto rounded-md border p-4">
        {document.fileType === "md" ? (
          <div data-color-mode="light">
            <MarkdownEditor
              value={document.content}
              preview="preview"
              hideToolbar
              visibleDragbar={false}
              textareaProps={{ readOnly: true }}
            />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-sm leading-6">{document.content}</pre>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除文件</DialogTitle>
            <DialogDescription>
              确认删除“{document.fileName}”？删除后无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
