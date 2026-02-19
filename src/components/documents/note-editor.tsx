"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { updateNoteContent } from "@/app/(app)/documents/actions";

const MarkdownEditor = dynamic(async () => (await import("@uiw/react-md-editor")).default, {
  ssr: false,
});

type NoteEditorProps = {
  documentId: string;
  initialContent: string;
};

export function NoteEditor({ documentId, initialContent }: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("已保存");

  const lastSavedContentRef = useRef(initialContent);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasUnsavedChanges = useMemo(
    () => content !== lastSavedContentRef.current,
    [content]
  );

  const persistContent = async (nextContent: string, showToast: boolean) => {
    if (nextContent === lastSavedContentRef.current) {
      return;
    }

    setIsSaving(true);
    setSaveMessage("保存中...");

    const result = await updateNoteContent(documentId, nextContent);

    if (!result.success) {
      setSaveMessage("保存失败");
      toast.error(result.message ?? "保存失败");
      setIsSaving(false);
      return;
    }

    lastSavedContentRef.current = nextContent;
    setSaveMessage("已保存");
    if (showToast) {
      toast.success("笔记已保存");
    }

    setIsSaving(false);
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void persistContent(content, false);
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {hasUnsavedChanges ? "内容有变更，自动保存中..." : saveMessage}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isSaving || !hasUnsavedChanges}
          onClick={() => void persistContent(content, true)}
        >
          {isSaving ? "保存中..." : "立即保存"}
        </Button>
      </div>

      <div data-color-mode="light">
        <MarkdownEditor
          value={content}
          preview="live"
          height={540}
          onChange={(value) => setContent(value ?? "")}
        />
      </div>
    </div>
  );
}
