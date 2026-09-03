import type { Metadata } from "next";

import { EditPropertyTypeClient } from "@/components/dashboard/views/property-types-id-edit-client";

export const metadata: Metadata = { title: "Edit property type", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function EditPropertyTypePage({
  params,
}: PageProps<"/dashboard/property-types/[id]/edit">) {
  const { id } = await params;
  return <EditPropertyTypeClient id={id} />;
}
