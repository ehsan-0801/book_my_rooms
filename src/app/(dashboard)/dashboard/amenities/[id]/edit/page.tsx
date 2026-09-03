import type { Metadata } from "next";

import { EditAmenityClient } from "@/components/dashboard/views/amenities-id-edit-client";

export const metadata: Metadata = { title: "Edit amenity", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function EditAmenityPage({
  params,
}: PageProps<"/dashboard/amenities/[id]/edit">) {
  const { id } = await params;
  return <EditAmenityClient id={id} />;
}
