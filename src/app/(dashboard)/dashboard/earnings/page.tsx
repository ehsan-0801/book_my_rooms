import type { Metadata } from "next";

import { EarningsClient } from "@/components/dashboard/views/earnings-client";

export const metadata: Metadata = { title: "Earnings", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function EarningsPage() {
  return <EarningsClient />;
}
