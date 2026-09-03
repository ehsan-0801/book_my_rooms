import type { Metadata } from "next";
import { Suspense } from "react";

import { CommissionsClient } from "@/components/dashboard/views/commissions-client";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";

export const metadata: Metadata = { title: "Commissions", robots: { index: false } };

/**
 * Server shell: emits metadata. The Suspense boundary is required because the
 * client body reads useSearchParams.
 */
export default function CommissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeaderSkeleton />
          <TableSkeleton rows={7} columns={7} />
        </div>
      }
    >
      <CommissionsClient />
    </Suspense>
  );
}
