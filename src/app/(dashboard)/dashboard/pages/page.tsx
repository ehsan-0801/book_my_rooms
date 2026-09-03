import type { Metadata } from "next";

import { ContentPagesClient } from "@/components/dashboard/views/pages-client";

export const metadata: Metadata = { title: "Content pages", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function ContentPagesPage() {
  return <ContentPagesClient />;
}
