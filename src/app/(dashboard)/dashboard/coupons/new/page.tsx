import type { Metadata } from "next";

import { NewCouponClient } from "@/components/dashboard/views/coupons-new-client";

export const metadata: Metadata = { title: "New coupon", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default function NewCouponPage() {
  return <NewCouponClient />;
}
