import type { Metadata } from "next";

import { CouponsClient } from "@/components/dashboard/views/coupons-client";

export const metadata: Metadata = { title: "Coupons", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function CouponsPage() {
  return <CouponsClient />;
}
