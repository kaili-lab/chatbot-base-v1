"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, NotebookPen, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteDocument } from "@/app/(app)/documents/actions";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import type { DocumentDetail } from "@/components/documents/types";
import { SafeMarkdownPreview } from "@/components/markdown/safe-markdown-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatFileSize(fileSize: number) {
  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${Math.round(fileSize / 1024)} KB`;
  }

  return `${(fileSize / 1024 / 1024).toFixed(1)} MB`;
}

function looksLikeMarkdown(content: string) {
  // WHAT: 对 .txt 做轻量 Markdown 特征探测；WHY: 用户常把 Markdown 内容存成 .txt，按纯文本渲染会丢失结构可读性。
  const markdownPattern =
    /(^|\n)\s{0,3}(#{1,6}\s|>\s|[-*+]\s|\d+\.\s|```)|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*/m;

  return markdownPattern.test(content);
}

type DocumentDetailViewProps = {
  document: DocumentDetail;
};

export function DocumentDetailView({ document }: DocumentDetailViewProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();
  const shouldRenderMarkdown = document.fileType === "md" || looksLikeMarkdown(document.content);

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon-sm" className="mt-0.5">
            <Link href="/documents" aria-label="返回文档列表">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              {document.isNote ? (
                <NotebookPen className="size-4 text-muted-foreground" />
              ) : (
                <FileText className="size-4 text-muted-foreground" />
              )}
              <h1 className="text-xl font-semibold tracking-tight">
                {document.fileName}
              </h1>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(document.createdAt).toLocaleDateString("zh-CN")} • {formatFileSize(document.fileSize)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DocumentStatusBadge status={document.status} />
          {document.isNote && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/documents/${document.id}/edit`}>编辑</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4" />
            删除
          </Button>
        </div>
      </div>

      <div className="min-h-[360px] max-h-[calc(100vh-220px)] overflow-y-auto rounded-md border bg-white p-4 dark:bg-background">
        {shouldRenderMarkdown ? (
          <SafeMarkdownPreview source={document.content} />
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-sm leading-7">{document.content}</pre>
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
