import type { Metadata } from "next";

import { NewBannerClient } from "@/components/dashboard/views/banners-new-client";

export const metadata: Metadata = { title: "New banner", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default function NewBannerPage() {
  return <NewBannerClient />;
}
