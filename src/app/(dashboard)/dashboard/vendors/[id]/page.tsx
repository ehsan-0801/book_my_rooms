import type { Metadata } from "next";

import { VendorDetailClient } from "@/components/dashboard/views/vendors-id-client";

export const metadata: Metadata = { title: "Vendor", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function VendorDetailPage({
  params,
}: PageProps<"/dashboard/vendors/[id]">) {
  const { id } = await params;
  return <VendorDetailClient id={id} />;
}
