import type { Metadata } from "next";
import { Suspense } from "react";

import { RefundsClient } from "@/components/dashboard/views/refunds-client";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";

export const metadata: Metadata = { title: "Refunds", robots: { index: false } };

/**
 * Server shell: emits metadata. The Suspense boundary is required because the
 * client body reads useSearchParams.
 */
export default function RefundsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeaderSkeleton />
          <TableSkeleton rows={7} columns={7} />
        </div>
      }
    >
      <RefundsClient />
    </Suspense>
  );
}
