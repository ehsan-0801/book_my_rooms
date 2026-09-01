import {
  FiltersSkeleton,
  ListSkeleton,
  PageHeaderSkeleton,
} from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <FiltersSkeleton count={3} />
      <ListSkeleton count={4} />
    </div>
  );
}
