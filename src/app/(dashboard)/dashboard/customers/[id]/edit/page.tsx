import type { Metadata } from "next";

import { EditCustomerClient } from "@/components/dashboard/views/customers-id-edit-client";

export const metadata: Metadata = { title: "Edit customer", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function EditCustomerPage({
  params,
}: PageProps<"/dashboard/customers/[id]/edit">) {
  const { id } = await params;
  return <EditCustomerClient id={id} />;
}
