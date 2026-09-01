import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading placeholders that mirror the real layout closely enough that nothing
 * jumps when the data lands — same heights, same column counts, same
 * table-on-desktop / cards-on-mobile split as `DataTable`.
 */

export function PageHeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {action ? <Skeleton className="h-9 w-32" /> : null}
    </div>
  );
}

export function FiltersSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-md" />
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-9 rounded-lg" />
          </div>
          <Skeleton className="mt-3 h-8 w-28" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <>
      {/* Tablet and desktop */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <div className="border-b bg-secondary/40 px-4 py-3">
          <div className="flex gap-4">
            {Array.from({ length: columns }, (_, i) => (
              <Skeleton
                key={i}
                className={cn("h-3", i === 0 ? "w-40" : "w-20")}
              />
            ))}
          </div>
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex items-center gap-4 px-4 py-3.5">
              {Array.from({ length: columns }, (_, c) => (
                <div key={c} className="flex items-center gap-3">
                  {c === 0 ? <Skeleton className="size-10 shrink-0 rounded-md" /> : null}
                  <Skeleton className={cn("h-4", c === 0 ? "w-32" : "w-16")} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {Array.from({ length: Math.min(rows, 4) }, (_, r) => (
          <li key={r} className="overflow-hidden rounded-xl border bg-card">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t bg-secondary/30 px-4 py-2.5">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function FormSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {Array.from({ length: sections }, (_, s) => (
        <div key={s} className="rounded-xl border bg-card p-5 sm:p-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-3.5 w-56 max-w-full" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-[16/10] rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
            <div className="flex items-center justify-between pt-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-3.5 w-full" />
          <Skeleton className="mt-2 h-3.5 w-4/5" />
          <div className="mt-4 flex justify-end gap-2 border-t pt-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <PageHeaderSkeleton />
      <StatsSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <Skeleton className="h-5 w-32" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <Skeleton className="h-5 w-24" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
