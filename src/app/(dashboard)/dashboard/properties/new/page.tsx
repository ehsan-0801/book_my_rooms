import type { Metadata } from "next";

import { NewPropertyClient } from "@/components/dashboard/views/properties-new-client";

export const metadata: Metadata = { title: "Add property", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default function NewPropertyPage() {
  return <NewPropertyClient />;
}
