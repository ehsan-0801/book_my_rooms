import type { Metadata } from "next";

import { NewReviewClient } from "@/components/dashboard/views/reviews-new-client";

export const metadata: Metadata = { title: "Write a review", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default function NewReviewPage() {
  return <NewReviewClient />;
}
