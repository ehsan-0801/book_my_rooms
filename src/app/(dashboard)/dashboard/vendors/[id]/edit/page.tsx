import type { Metadata } from "next";

import { EditVendorClient } from "@/components/dashboard/views/vendors-id-edit-client";

export const metadata: Metadata = { title: "Edit vendor", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function EditVendorPage({
  params,
}: PageProps<"/dashboard/vendors/[id]/edit">) {
  const { id } = await params;
  return <EditVendorClient id={id} />;
}
