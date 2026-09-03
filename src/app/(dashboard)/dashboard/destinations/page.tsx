import type { Metadata } from "next";

import { DestinationsClient } from "@/components/dashboard/views/destinations-client";

export const metadata: Metadata = { title: "Destinations", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function DestinationsPage() {
  return <DestinationsClient />;
}
