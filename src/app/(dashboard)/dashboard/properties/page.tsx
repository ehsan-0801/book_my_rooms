import type { Metadata } from "next";
import { Suspense } from "react";

import { PropertiesClient } from "@/components/dashboard/views/properties-client";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";

export const metadata: Metadata = { title: "Properties", robots: { index: false } };

/**
 * Server shell: emits metadata. The Suspense boundary is required because the
 * client body reads useSearchParams.
 */
export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeaderSkeleton />
          <TableSkeleton rows={7} columns={7} />
        </div>
      }
    >
      <PropertiesClient />
    </Suspense>
  );
}
