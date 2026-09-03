import type { Metadata } from "next";
import { Suspense } from "react";

import { ReviewsClient } from "@/components/dashboard/views/reviews-client";
import { PageHeaderSkeleton } from "@/components/dashboard/skeletons";

export const metadata: Metadata = { title: "Reviews", robots: { index: false } };

/**
 * Server shell: emits metadata. The Suspense boundary is required because
 * the client body reads useSearchParams.
 */
export default function ReviewsPage() {
  return (
    <Suspense fallback={<PageHeaderSkeleton />}>
      <ReviewsClient />
    </Suspense>
  );
}
