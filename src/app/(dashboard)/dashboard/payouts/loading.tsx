import {
  PageHeaderSkeleton,
  StatsSkeleton,
  TableSkeleton,
} from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action={false} />
      <StatsSkeleton count={2} />
      <TableSkeleton rows={6} columns={7} />
    </div>
  );
}
