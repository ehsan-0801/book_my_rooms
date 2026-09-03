import type { Metadata } from "next";

import { EditCouponClient } from "@/components/dashboard/views/coupons-id-edit-client";

export const metadata: Metadata = { title: "Edit coupon", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function EditCouponPage({
  params,
}: PageProps<"/dashboard/coupons/[id]/edit">) {
  const { id } = await params;
  return <EditCouponClient id={id} />;
}
