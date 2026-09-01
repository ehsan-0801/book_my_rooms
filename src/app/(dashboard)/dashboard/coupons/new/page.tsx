import type { Metadata } from "next";

import { CouponForm } from "@/components/dashboard/coupon-form";
import { FormShell } from "@/components/dashboard/form";
import { requireAdmin } from "@/lib/auth-guards";
import { createCoupon } from "@/lib/actions/catalog";

export const metadata: Metadata = { title: "New coupon", robots: { index: false } };

export default async function NewCouponPage() {
  await requireAdmin();
  return (
    <FormShell
      title="New coupon"
      description="Travellers enter this code at checkout."
      backHref="/dashboard/coupons"
      backLabel="Back to coupons"
    >
      <CouponForm action={createCoupon} submitLabel="Create coupon" />
    </FormShell>
  );
}
