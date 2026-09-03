import type { Metadata } from "next";

import { OffersClient } from "@/components/dashboard/views/offers-client";

export const metadata: Metadata = { title: "Offers", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function OffersPage() {
  return <OffersClient />;
}
