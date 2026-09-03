import type { Metadata } from "next";

import { PayoutsClient } from "@/components/dashboard/views/payouts-client";

export const metadata: Metadata = { title: "Payouts", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function PayoutsPage() {
  return <PayoutsClient />;
}
