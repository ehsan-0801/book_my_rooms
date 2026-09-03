import type { Metadata } from "next";

import { PaymentsClient } from "@/components/dashboard/views/payments-client";

export const metadata: Metadata = { title: "Payments", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function PaymentsPage() {
  return <PaymentsClient />;
}
