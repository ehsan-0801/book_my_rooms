import type { Metadata } from "next";

import { NewContentPageClient } from "@/components/dashboard/views/pages-new-client";

export const metadata: Metadata = { title: "New page", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default function NewContentPage() {
  return <NewContentPageClient />;
}
