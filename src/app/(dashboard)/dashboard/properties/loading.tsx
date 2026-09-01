import {
  FiltersSkeleton,
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <FiltersSkeleton count={5} />
      <TableSkeleton rows={7} columns={7} />
    </div>
  );
}
