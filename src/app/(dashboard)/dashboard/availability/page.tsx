import type { Metadata } from "next";
import { Suspense } from "react";

import { AvailabilityClient } from "@/components/dashboard/views/availability-client";
import { PageHeaderSkeleton } from "@/components/dashboard/skeletons";

export const metadata: Metadata = { title: "Availability", robots: { index: false } };

/**
 * Server shell: emits metadata. The Suspense boundary is required because the
 * client body reads useSearchParams.
 */
export default function AvailabilityPage() {
  return (
    <Suspense fallback={<PageHeaderSkeleton />}>
      <AvailabilityClient />
    </Suspense>
  );
}
