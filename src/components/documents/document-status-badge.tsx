import { Badge } from "@/components/ui/badge";

export type DocumentStatus = "uploading" | "processing" | "completed" | "failed";

const STATUS_LABELS: Record<DocumentStatus, string> = {
  uploading: "Uploading",
  processing: "Processing",
  completed: "Indexed",
  failed: "Failed",
};

const STATUS_STYLES: Record<DocumentStatus, string> = {
  uploading: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  processing: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

type DocumentStatusBadgeProps = {
  status: DocumentStatus;
};

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  return (
    <Badge className={STATUS_STYLES[status]} variant="secondary">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
