import type { Metadata } from "next";

import { PropertyTypesClient } from "@/components/dashboard/views/property-types-client";

export const metadata: Metadata = { title: "Property types", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function PropertyTypesPage() {
  return <PropertyTypesClient />;
}
