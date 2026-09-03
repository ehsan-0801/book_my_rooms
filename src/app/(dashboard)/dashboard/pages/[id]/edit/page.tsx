import type { Metadata } from "next";

import { EditContentPageClient } from "@/components/dashboard/views/pages-id-edit-client";

export const metadata: Metadata = { title: "Edit page", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function EditContentPage({
  params,
}: PageProps<"/dashboard/pages/[id]/edit">) {
  const { id } = await params;
  return <EditContentPageClient id={id} />;
}
