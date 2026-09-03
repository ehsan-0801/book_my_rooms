import type { Metadata } from "next";

import { AmenitiesClient } from "@/components/dashboard/views/amenities-client";

export const metadata: Metadata = { title: "Amenities", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function AmenitiesPage() {
  return <AmenitiesClient />;
}
