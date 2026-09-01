import {
  PageHeaderSkeleton,
  StatsSkeleton,
  TableSkeleton,
} from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action={false} />
      <StatsSkeleton />
      <StatsSkeleton count={3} />
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}
