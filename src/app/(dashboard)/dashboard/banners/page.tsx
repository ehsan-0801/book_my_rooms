import type { Metadata } from "next";

import { BannersClient } from "@/components/dashboard/views/banners-client";

export const metadata: Metadata = { title: "Banners", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function BannersPage() {
  return <BannersClient />;
}
