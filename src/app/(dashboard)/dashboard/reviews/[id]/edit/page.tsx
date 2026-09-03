import type { Metadata } from "next";

import { EditReviewClient } from "@/components/dashboard/views/reviews-id-edit-client";

export const metadata: Metadata = { title: "Edit review", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function EditReviewPage({
  params,
}: PageProps<"/dashboard/reviews/[id]/edit">) {
  const { id } = await params;
  return <EditReviewClient id={id} />;
}
