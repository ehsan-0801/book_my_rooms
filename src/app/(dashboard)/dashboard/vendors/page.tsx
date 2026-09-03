import type { Metadata } from "next";
import { Suspense } from "react";

import { VendorsClient } from "@/components/dashboard/views/vendors-client";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";

export const metadata: Metadata = { title: "Vendors", robots: { index: false } };

/**
 * Server shell: emits metadata. The Suspense boundary is required because the
 * client body reads useSearchParams.
 */
export default function VendorsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeaderSkeleton />
          <TableSkeleton rows={7} columns={7} />
        </div>
      }
    >
      <VendorsClient />
    </Suspense>
  );
}
