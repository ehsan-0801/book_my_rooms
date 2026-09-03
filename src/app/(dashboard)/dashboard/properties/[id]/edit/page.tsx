import type { Metadata } from "next";

import { EditPropertyClient } from "@/components/dashboard/views/properties-id-edit-client";

export const metadata: Metadata = { title: "Edit property", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function EditPropertyPage({
  params,
}: PageProps<"/dashboard/properties/[id]/edit">) {
  const { id } = await params;
  return <EditPropertyClient id={id} />;
}
