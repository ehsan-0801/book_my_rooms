import type { Metadata } from "next";

import { EditDestinationClient } from "@/components/dashboard/views/destinations-id-edit-client";

export const metadata: Metadata = { title: "Edit destination", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function EditDestinationPage({
  params,
}: PageProps<"/dashboard/destinations/[id]/edit">) {
  const { id } = await params;
  return <EditDestinationClient id={id} />;
}
