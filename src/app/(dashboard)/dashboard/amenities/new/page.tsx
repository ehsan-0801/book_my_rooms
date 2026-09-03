import type { Metadata } from "next";

import { NewAmenityClient } from "@/components/dashboard/views/amenities-new-client";

export const metadata: Metadata = { title: "New amenity", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default function NewAmenityPage() {
  return <NewAmenityClient />;
}
