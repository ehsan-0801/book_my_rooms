import type { Metadata } from "next";

import { NewDestinationClient } from "@/components/dashboard/views/destinations-new-client";

export const metadata: Metadata = { title: "New destination", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default function NewDestinationPage() {
  return <NewDestinationClient />;
}
