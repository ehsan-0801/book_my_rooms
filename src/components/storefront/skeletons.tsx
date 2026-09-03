import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Storefront loading placeholders, shaped like the sections they stand in for. */

export function HeroSkeleton() {
  return (
    <section className="relative isolate overflow-hidden bg-muted">
      <div className="mx-auto w-full max-w-7xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20 lg:px-8 lg:pt-28 lg:pb-16">
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-4 w-64 bg-foreground/10" />
          <Skeleton className="h-14 w-full max-w-lg bg-foreground/10" />
          <Skeleton className="h-5 w-full max-w-xl bg-foreground/10" />
          <Skeleton className="h-5 w-80 bg-foreground/10" />
        </div>
        <Skeleton className="mt-8 h-28 w-full rounded-2xl bg-foreground/10 lg:mt-10" />
      </div>
    </section>
  );
}

export function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-36" />
            <div className="flex items-center justify-between border-t pt-3">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RowListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-xl border bg-card sm:flex-row">
          <Skeleton className="aspect-[16/10] w-full rounded-none sm:aspect-auto sm:w-64" />
          <div className="flex-1 space-y-3 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-64 max-w-full" />
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3.5 w-full max-w-md" />
            <div className="flex items-center justify-between border-t pt-3">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RailSkeleton({
  count = 3,
  className,
  height = "aspect-[4/3]",
}: {
  count?: number;
  className?: string;
  height?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={cn("rounded-xl", height)} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-4 h-6 w-40" />
      <Skeleton className="mt-3 h-10 w-full max-w-2xl" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-5 grid gap-2 sm:grid-cols-4 sm:grid-rows-2 lg:h-[26rem]">
        <Skeleton className="aspect-[4/3] rounded-xl sm:col-span-2 sm:row-span-2 sm:aspect-auto" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="hidden rounded-xl sm:block" />
        ))}
      </div>
      <div className="mt-8 lg:grid lg:grid-cols-[1fr_22rem] lg:gap-8">
        <div className="space-y-4">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-6 h-40 w-full rounded-xl" />
        </div>
        <Skeleton className="mt-6 h-96 rounded-xl lg:mt-0" />
      </div>
    </div>
  );
}
