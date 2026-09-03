import type { Metadata } from "next";

import { CustomerDetailClient } from "@/components/dashboard/views/customers-id-client";

export const metadata: Metadata = { title: "Customer", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function CustomerDetailPage({
  params,
}: PageProps<"/dashboard/customers/[id]">) {
  const { id } = await params;
  return <CustomerDetailClient id={id} />;
}
