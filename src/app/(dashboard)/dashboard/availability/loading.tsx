import {
  FiltersSkeleton,
  PageHeaderSkeleton,
} from "@/components/dashboard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action={false} />
      <FiltersSkeleton count={4} />
      <div className="rounded-xl border bg-card p-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-3.5 w-72 max-w-full" />
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-card p-5">
        <Skeleton className="h-5 w-56" />
        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }, (_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
