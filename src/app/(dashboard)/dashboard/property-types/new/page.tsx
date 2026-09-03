import type { Metadata } from "next";

import { NewPropertyTypeClient } from "@/components/dashboard/views/property-types-new-client";

export const metadata: Metadata = { title: "New property type", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default function NewPropertyTypePage() {
  return <NewPropertyTypeClient />;
}
