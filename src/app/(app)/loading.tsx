import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col gap-4 px-6 py-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    </div>
  );
}
