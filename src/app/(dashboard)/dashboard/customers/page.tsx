import type { Metadata } from "next";

import { CustomersClient } from "@/components/dashboard/views/customers-client";

export const metadata: Metadata = { title: "Customers", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function CustomersPage() {
  return <CustomersClient />;
}
