import {
  FiltersSkeleton,
  PageHeaderSkeleton,
  StatsSkeleton,
  TableSkeleton,
} from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action={false} />
      <StatsSkeleton count={2} />
      <FiltersSkeleton count={6} />
      <TableSkeleton rows={7} columns={8} />
    </div>
  );
}
