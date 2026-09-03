import type { Metadata } from "next";

import { EditBannerClient } from "@/components/dashboard/views/banners-id-edit-client";

export const metadata: Metadata = { title: "Edit banner", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function EditBannerPage({
  params,
}: PageProps<"/dashboard/banners/[id]/edit">) {
  const { id } = await params;
  return <EditBannerClient id={id} />;
}
